var graph = null;

function union_arrays (x, y) {
  var obj = {};
  for (var i = x.length-1; i >= 0; -- i)
     obj[x[i]] = x[i];
  for (var i = y.length-1; i >= 0; -- i)
     obj[y[i]] = y[i];
  var res = []
  for (var k in obj) {
    if (obj.hasOwnProperty(k))  // <-- optional
      res.push(obj[k]);
  }
  return res;
}


define('goi-machine', function(require) {
	var PatternType = require('parser/pattern');
	var Pattern = require('ast/pattern'); 
	var Abstraction = require('ast/abstraction');
	var Application = require('ast/application');
	var Identifier = require('ast/identifier');
	var Constant = require('ast/constant');
	var Operation = require('ast/operation');
	var UnaryOp = require('ast/unary-op');
	var BinaryOp = require('ast/binary-op');
	var IfThenElse = require('ast/if-then-else');
	var Recursion = require('ast/recursion');
	var Tuple = require('ast/tuple');
	var ProvisionalConstant = require('ast/provisional-constant');
	var Change = require('ast/change');
	var Assign = require('ast/assign');
	var Propagation = require('ast/propagation');
	var Deprecation = require('ast/deprecation');
	var Dereference = require('ast/deref');
	var Fusion = require('ast/fusion');
	var Pc = require('ast/pc');
	var Folding = require('ast/fold');

	var Lexer = require('parser/lexer');
	var Parser = require('parser/parser');

	var MachineToken = require('token');
	var Link = require('link');		

	var Graph = require('graph');
	var Group = require('group');
	var Term = require('term');
	var BoxWrapper = require('box-wrapper');

	var Expo = require('nodes/expo');
	var Abs = require('nodes/abs');
	var App = require('nodes/app');
	var BinOp = require('nodes/binop');
	var Const = require('nodes/const');
	var Contract = require('nodes/contract');
	var Der = require('nodes/der');
	var Var = require('nodes/var');
	var If = require('nodes/if');
	var Pax = require('nodes/pax');
	var Promo = require('nodes/promo');
	var Recur = require('nodes/recur');
	var Start = require('nodes/start');
	var UnOp = require('nodes/unop');
	var Weak = require('nodes/weak');
	var Delta = require('nodes/delta');
	var Set = require('nodes/set');
	var Dep = require('nodes/dep');
	var Deref = require('nodes/deref');
	var Mod = require('nodes/mod');
	var Prop = require('nodes/prop');
	var Prov = require('nodes/prov');
	var PatTuple = require('nodes/pattuple');
	var Pair = require('nodes/pair');
	var Fuse = require('nodes/fusion');
	var ProvCon = require('nodes/pc');
	var Fold = require('nodes/fold');

	var GC = require('gc');

	class GoIMachine {
		
		constructor() {
			this.graph = new Graph(this);
			graph = this.graph; // cheating!
			this.token = new MachineToken(this); 
			this.gc = new GC(this.graph);
			this.count = 0;

			this.token.isMain = true;
			this.evalTokens = [];
			this.cells = [];
			this.evaluating = false;
			this.newValues = new Map();
			this.hasUpdate = false;
		}

		compile(source) {
			const lexer = new Lexer(source + '\0');
			const parser = new Parser(lexer);
			const ast = parser.parse();
			// init
			this.graph.clear();
			this.token.reset();
			this.count = 0;

			this.evalTokens = [];
			this.cells = [];
			this.readyEvalTokens = 0;
			this.evaluating = false;
			this.newValues.clear();
			this.hasUpdate = false;
			// create graph
			var start = new Start().addToGroup(this.graph.child);
			var term = this.toGraph(ast, this.graph.child);
			new Link(start.key, term.prin.key, "n", "s").addToGroup(this.graph.child);
			this.deleteVarNode(this.graph.child);
		}

		// translation
		toGraph(ast, group) {
			var graph = this.graph;

			if (ast instanceof Identifier) {
				var v = new Var(ast.name).addToGroup(group);
				return new Term(v, [v]);
			} 

			else if (ast instanceof Abstraction) {
				var params;
				var paramUsed;
				var auxNodes;
				if (ast.pattern.type == PatternType.Id) {
					params = [ast.pattern.id1]; 
					paramUsed = [false];
					auxNodes = [null];
				}
				else if (ast.pattern.type == PatternType.Tuple) {
					params = [ast.pattern.id1, ast.pattern.id2];
					paramUsed = [false,false];
					auxNodes = [null,null];
				}
				var wrapper = BoxWrapper.create().addToGroup(group);
				var abs = new Abs().addToGroup(wrapper.box);
				var term = this.toGraph(ast.body, wrapper.box);
				new Link(wrapper.prin.key, abs.key, "n", "s").addToGroup(wrapper);

				new Link(abs.key, term.prin.key, "e", "s").addToGroup(abs.group);

				var auxs = Array.from(term.auxs);
				
				for (var i=0;i<params.length;i++) {
					for (let aux of term.auxs) {
						if (aux.name == params[i]) {
							paramUsed[i] = true;
							auxNodes[i] = aux;
							break;
						}
					}
				}
				for (var i=0;i<params.length;i++) {
					if (paramUsed[i]) {
						auxs.splice(auxs.indexOf(auxNodes[i]), 1);
					} else {
						auxNodes[i] = new Weak(params[i]).addToGroup(abs.group);
					}	
				}
				if (ast.pattern.type == PatternType.Id)
					new Link(auxNodes[0].key, abs.key, "nw", "w", true).addToGroup(abs.group);
				else if (ast.pattern.type == PatternType.Tuple) {
					var pattern = new PatTuple().addToGroup(abs.group);
					new Link(auxNodes[0].key, pattern.key, "n", "w").addToGroup(abs.group);
					new Link(auxNodes[1].key, pattern.key, "n", "e").addToGroup(abs.group);
					new Link(pattern.key, abs.key, "nw", "w", true).addToGroup(abs.group);
				}

				wrapper.auxs = wrapper.createPaxsOnTopOf(auxs);

				return new Term(wrapper.prin, wrapper.auxs);
			} 

			else if (ast instanceof Application) {
				var app = new App().addToGroup(group);
				//lhs
				var left = this.toGraph(ast.lhs, group);
				var der = new Der(left.prin.name).addToGroup(group);
				new Link(der.key, left.prin.key, "n", "s").addToGroup(group);
				// rhs
				var right = this.toGraph(ast.rhs, group);		
				
				new Link(app.key, der.key, "w", "s").addToGroup(group);
				new Link(app.key, right.prin.key, "e", "s").addToGroup(group);

				return new Term(app, Term.joinAuxs(left.auxs, right.auxs, group));
			} 

			else if (ast instanceof Constant) {
				var wrapper = BoxWrapper.create().addToGroup(group);
				var constant = new Const(ast.value).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, constant.key, "n", "s").addToGroup(wrapper);
				return new Term(wrapper.prin, wrapper.auxs);
			}

			else if (ast instanceof BinaryOp) {
				var binop = new BinOp(ast.name).addToGroup(group);

				binop.subType = ast.type;
				var left = this.toGraph(ast.v1, group);
				var right = this.toGraph(ast.v2, group);

				new Link(binop.key, left.prin.key, "w", "s").addToGroup(group);
				new Link(binop.key, right.prin.key, "e", "s").addToGroup(group);

				return new Term(binop, Term.joinAuxs(left.auxs, right.auxs, group));
			}

			else if (ast instanceof UnaryOp) {
				var unop = new UnOp(ast.name).addToGroup(group);
				unop.subType = ast.type;
				var box = this.toGraph(ast.v1, group);

				new Link(unop.key, box.prin.key, "n", "s").addToGroup(group);

				return new Term(unop, box.auxs);
			}

			else if (ast instanceof IfThenElse) {
				var ifnode = new If().addToGroup(group);
				var cond = this.toGraph(ast.cond, group);
				var t1 = this.toGraph(ast.t1, group);
				var t2 = this.toGraph(ast.t2, group);

				new Link(ifnode.key, cond.prin.key, "w", "s").addToGroup(group);
				new Link(ifnode.key, t1.prin.key, "n", "s").addToGroup(group);
				new Link(ifnode.key, t2.prin.key, "e", "s").addToGroup(group);

				return new Term(ifnode, Term.joinAuxs(Term.joinAuxs(t1.auxs, t2.auxs, group), cond.auxs, group));
			}

			else if (ast instanceof Recursion) {
				var p1 = ast.param;
				// recur term
				var wrapper = BoxWrapper.create().addToGroup(group);
				wrapper.prin.delete();
				var recur = new Recur().addToGroup(wrapper);
				wrapper.prin = recur;
				var box = this.toGraph(ast.body, wrapper.box);
				wrapper.auxs = wrapper.createPaxsOnTopOf(box.auxs);

				new Link(recur.key, box.prin.key, "e", "s").addToGroup(wrapper);

				var p1Used = false;
				var auxNode1;
				for (var i=0; i<wrapper.auxs.length; i++) {
					var aux = wrapper.auxs[i];
					if (aux.name == p1) {
						p1Used = true;
						auxNode1 = this.graph.findNodeByKey(aux.findLinksInto(null)[0].from);
						aux.delete();
						break;
					}
				}
				if (p1Used) {
					// wrapper.auxs.splice(wrapper.auxs.indexOf(auxNode1), 1);
				} else {
					auxNode1 = new Weak(p1).addToGroup(wrapper.box);
				}
				new Link(auxNode1.key, recur.key, "nw", "w", true).addToGroup(wrapper);
				return new Term(wrapper.prin, wrapper.auxs);
			}

			else if (ast instanceof Tuple) {
				var pair = new Pair().addToGroup(group);
				var left = this.toGraph(ast.lhs, group);
				var right = this.toGraph(ast.rhs, group);

				new Link(pair.key, left.prin.key, "w", "s").addToGroup(group);
				new Link(pair.key, right.prin.key, "e", "s").addToGroup(group);

				return new Term(pair, Term.joinAuxs(left.auxs, right.auxs, group));
			}

			else if (ast instanceof ProvisionalConstant) {
				var term = this.toGraph(ast.term, group);
				var prov = new Prov().addToGroup(group);
				new Link(prov.key, term.prin.key, "n", "s").addToGroup(group);
				return new Term(prov, term.auxs);
			}

			else if (ast instanceof Deprecation) {
				var term = this.toGraph(ast.term, group);
				var dep = new Dep().addToGroup(group);
				new Link(dep.key, term.prin.key, "n", "s").addToGroup(group);
				return new Term(dep, term.auxs);
			}

			else if (ast instanceof Dereference) {
				var term = this.toGraph(ast.term, group);
				var deref = new Deref().addToGroup(group);
				new Link(deref.key, term.prin.key, "n", "s").addToGroup(group);
				return new Term(deref, term.auxs); 
			}

			else if (ast instanceof Change) {
				var param = ast.param;
				var delta = new Delta().addToGroup(group);
				var term = this.toGraph(ast.body, group);
				var v = new Var(param).addToGroup(group);
				new Link(delta.key, v.key, "w", "s").addToGroup(group);
				new Link(delta.key, term.prin.key, "e", "s").addToGroup(group);

				var auxs = Array.from(term.auxs);
				var p1Used = false;
				var auxNode1;
				for (var i=0; i<term.auxs.length; i++) {
					var aux = auxs[i];
					if (aux.name == param) {
						p1Used = true;
						auxs.splice(i, 1);
						var con = new Contract(aux.name).addToGroup(group);
						new Link(aux.key, con.key, "n", "s").addToGroup(group);
						new Link(v.key, con.key, "n", "s").addToGroup(group);
						auxs.push(con);
						break;
					}
				}
				if (!p1Used)
					auxs.push(v);

				return new Term(delta, auxs);
			}

			else if (ast instanceof Assign) {
				var param = ast.param;
				var setn = new Set().addToGroup(group);
				var term = this.toGraph(ast.body, group);
				var v = new Var(param).addToGroup(group);
				new Link(setn.key, v.key, "w", "s").addToGroup(group);
				new Link(setn.key, term.prin.key, "e", "s").addToGroup(group);

				var auxs = Array.from(term.auxs);
				var p1Used = false;
				var auxNode1;
				for (var i=0; i<term.auxs.length; i++) {
					var aux = auxs[i];
					if (aux.name == param) {
						p1Used = true;
						auxs.splice(i, 1);
						var con = new Contract(aux.name).addToGroup(group);
						new Link(aux.key, con.key, "n", "s").addToGroup(group);
						new Link(v.key, con.key, "n", "s").addToGroup(group);
						auxs.push(con);
						break;
					}
				}
				if (!p1Used)
					auxs.push(v);

				return new Term(setn, auxs);
			}

			else if (ast instanceof Propagation) {
				var prop = new Prop().addToGroup(group);
				return new Term(prop, []);
			}

			else if (ast instanceof Pc) {
				var data = ast.data;
				var pc = new ProvCon(data).addToGroup(group);

				return new Term(pc, []);
			}

			else if (ast instanceof Fusion) {
				var abs = new Fuse().addToGroup(group);
				var box = this.toGraph(ast.term, group);

				new Link(abs.key, box.prin.key, "n", "s").addToGroup(group);

				return new Term(abs, box.auxs);
			}

			else if (ast instanceof Folding) {
				var fold = new Fold().addToGroup(group);

				var left = this.toGraph(ast.v1, group);
				var right = this.toGraph(ast.v2, group);

				new Link(fold.key, left.prin.key, "w", "s").addToGroup(group);
				new Link(fold.key, right.prin.key, "e", "s").addToGroup(group);

				return new Term(fold, Term.joinAuxs(left.auxs, right.auxs, group));
			}
		}

		deleteVarNode(group) {
			for (let node of Array.from(group.nodes)) {
				if (node instanceof Group)
					this.deleteVarNode(node);
				else if (node instanceof Var) 
					node.deleteAndPreserveOutLink();
			}
		}

		startPropagation() {
			this.evaluating = true;
			this.hasUpdate = false;
			for (let key of this.cells) {
				var cell = this.graph.findNodeByKey(key);
				var dep = this.graph.findNodeByKey(cell.dep_key);
				var evalToken = new MachineToken(this);
				evalToken.isMain = false;
				evalToken.setLink(dep.findLinksOutOf(null)[0]);
				this.evalTokens.push(evalToken);
			} 
		}

		shuffle(a) {
		    var j, x, i;
		    for (i = a.length - 1; i > 0; i--) {
		        j = Math.floor(Math.random() * (i + 1));
		        x = a[i];
		        a[i] = a[j];
		        a[j] = x;
		    }
		}

		batchPass(tokens) {
			var arr_2 = Array.from(tokens);
			// random
			/*
			var arr = Array.from(new Array(tokens.length),(val,index)=>index+1);
			this.shuffle(arr);
			for (var i=0; i<arr.length; i++) {
				var token = arr_2[arr[i]-1];
				this.tokenPass(token, flag, dataStack, boxStack, modStack);
			}
			*/
			
			// all progress 1 step
			for (var i=0; i<arr_2.length; i++) {
				var token = arr_2[i];
				
				this.tokenPass(token);
			}
		}

		// machine step
		pass(flag, dataStack, boxStack, modStack) {	
			if (!finished) {
				/*
				this.count++;
				if (this.count == 200) {
					this.count = 0;
					this.gc.collect();
				}
				*/
				if (this.evaluating) {
					this.batchPass(this.evalTokens);
					if (this.evalTokens.length == 0) {
						this.evaluating = false;
						var machine = this;
						this.newValues.forEach(function(value, key, map) {
							var mod = machine.graph.findNodeByKey(key);
							var oldData = mod.update(value);
							if (oldData != value)
								machine.hasUpdate = true;
						})
						this.newValues.clear();
						return;
					}
				}

				else
					this.tokenPass(this.token, flag, dataStack, boxStack);
			}
		}

		tokenPass(token, flag, dataStack, boxStack) {
			var node;
			if (!token.transited) {
				if (token.link != null) {
					var target = token.forward ? token.link.to : token.link.from;
					node = this.graph.findNodeByKey(target);
				}
				else 
					node = this.graph.findNodeByKey("nd1"); 
				
				var nextLink;

				token.rewrite = false;
				nextLink = node.transition(token, token.link);
				console.log(nextLink);


				if (nextLink != null) {
					token.setLink(nextLink);
					token.transited = true;
					if (token.isMain) {
						this.printHistory(token, flag, dataStack, boxStack); 
					}
				}
				else {
					token.transited = false;
					if (token.isMain) {
						token.setLink(null);
						//this.gc.collect();
						play = false;
						playing = false;
						finished = true;
					}
					else
						token.setLink(token.link);
				}
			}

			else {
				var target = token.forward ? token.link.from : token.link.to;
				node = this.graph.findNodeByKey(target);
				var nextLink = node.rewrite(token, token.link);
				console.log(nextLink);
				if (!token.rewrite) {
					token.transited = false;
					this.tokenPass(token, flag, dataStack, boxStack); 
				}
				else {
					token.setLink(nextLink);
					if (token.isMain)
						this.printHistory(token, flag, dataStack, boxStack);
				}
			}
		}

		

		printHistory(token, flag, dataStack, boxStack) {
			flag.val(token.rewriteFlag + '\n' + flag.val());
			var dataStr = token.dataStack.length == 0 ? '□' : Array.from(token.dataStack).reverse().toString() + ',□';
			dataStack.val(dataStr + '\n' + dataStack.val());
			var boxStr = token.boxStack.length == 0 ? '□' : Array.from(token.boxStack).reverse().toString() + ',□';
			boxStack.val(boxStr + '\n' + boxStack.val());
		}

	}
	return new GoIMachine();	
});