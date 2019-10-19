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

var names = 0;

function newName() {
	var name = "α" + names;
	names++; 
	return name;
} 


define('goi-machine', function(require) {
	var PatternType = require('parser/pattern');
	var Pattern = require('ast/pattern'); 
	var Abstraction = require('ast/abstraction');
	var Application = require('ast/application');
	var Identifier = require('ast/identifier');
	var Constant = require('ast/constant');
	var Operation = require('ast/operation');
	var IfThenElse = require('ast/if-then-else'); 
	var Recursion = require('ast/recursion');
	var Tuple = require('ast/tuple');
	var CellCreation = require('ast/cell-creation');
	var Fusion = require('ast/fusion');
	var Pc = require('ast/pc');
  	var NameAbstraction = require('ast/name-abstraction');
  	var NameInstantiation = require('ast/name-instantiation');

	var Token = require('parser/token');
	var Lexer = require('parser/lexer');
	var Parser = require('parser/parser');

	var MachineToken = require('token');
	var RewriteFlag = require('token').RewriteFlag();
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
	var Deref = require('nodes/deref');
	var PatTuple = require('nodes/pattuple');
	var Pair = require('nodes/pair');
	var Fuse = require('nodes/fusion');
	var Fold = require('nodes/fold');

	var Assign = require('nodes/assign');
	var Linking = require('nodes/linking');
	var CellCreate = require('nodes/cell-create');
	var Cell = require('nodes/cell');
	var Step = require('nodes/step');
	var ProvCon = require('nodes/pc');
	var Peek = require('nodes/peek');
	var Root = require('nodes/root');

	var BigLambda = require('nodes/biglambda');
	var NameInstance = require('nodes/name-instance');

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
			names = 0;

			this.evalTokens = [];
			this.cells = [];
			this.readyEvalTokens = 0;
			this.evaluating = false;
			this.newValues.clear();
			this.hasUpdate = false;
			// create graph
			var start = new Start().addToGroup(this.graph.child);
			console.log(ast);
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
						auxNodes[i] = new Contract(params[i]).addToGroup(abs.group);
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
					auxNode1 = new Contract(p1).addToGroup(wrapper.box);
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

			else if (ast instanceof Pc) {
				var data = ast.data;
				var pc = new ProvCon(data).addToGroup(group);

				return new Term(pc, []);
			}

			else if (ast instanceof Fusion) {
				var params;
				var paramUsed;
				var auxNodes;
				params = [ast.id]; 
				var orig_name = ast.name; 
				var name = newName();
				paramUsed = [false];
				auxNodes = [null];

				var wrapper = BoxWrapper.create().addToGroup(group);
				var abs = new Fuse(name).addToGroup(wrapper.box);
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
						auxNodes[i] = new Contract(params[i]).addToGroup(abs.group);
					}	
				}

				new Link(auxNodes[0].key, abs.key, "nw", "w", true).addToGroup(abs.group);


				wrapper.auxs = wrapper.createPaxsOnTopOf(auxs);
				wrapper.updateNames(orig_name, name);

				return new Term(wrapper.prin, wrapper.auxs);
			}

			else if (ast instanceof Operation) {
				var node; 
				var machine = this;
				switch (ast.type) {
					case Token.AND: 
					case Token.OR:
					case Token.PLUS:
					case Token.SUB:
					case Token.MULT:
					case Token.DIV:
					case Token.MOD:
					case Token.LTE:
					case Token.NEQ:
						var node = new BinOp(ast.name, ast.type, false); return this.createBinOp(node, group); 
					case Token.COMMA:
						var node = new Pair(); return this.createBinOp(node, group); 
					case Token.VECPLUS:
					case Token.VECMULT:
					case Token.VECDOT: 
						var name = newName();
						var node = new BinOp(ast.name, ast.type, true, name); 
						return this.createNameAbstraction(node, this.createBinOp, name, group);
					case Token.LINK:
						var node = new Linking(); return this.createBinOp(node, group); 
					case Token.ASSIGN:
						if (ast.hasPname) {
							var name = newName();
							var node = new Assign(true, name);
							return this.createNameAbstraction(node, this.createBinOp, name, group);
						}
						else {
							var node = new Assign(false); 
							return this.createBinOp(node, group); 
						}
					case Token.FOLD: 
						var name = newName();
						var node = new Fold(name); 
						return this.createNameAbstraction(node, this.createBinOp, name, group);
					case Token.NOT:
						var node = new UnOp(ast.name, ast.type, false); return this.createUnOp(node, group); 
					case Token.CELLCREATE:
						var node = new CellCreate(); return this.createUnOp(node, group);
					case Token.PEEK:
						var node = new Peek(); return this.createUnOp(node, group); 
					case Token.ROOT:
						var node = new Root(); return this.createUnOp(node, group);						
					case Token.DEREF:
						if (ast.hasPname) {
							var name = newName(); 
							var node = new Deref(true, name);
							return this.createNameAbstraction(node, this.createUnOp, name, group);
						}
						else {
							var node = new Deref(false); 
							return this.createUnOp(node, group); 
						}
					case Token.STEP:
						var node = new Step().addToGroup(group); 
						return new Term(node, []);
				}
			}

			else if (ast instanceof NameAbstraction) {
				// term
				var orig_name = ast.name; 
				var name = newName();

				var outter = BoxWrapper.create().addToGroup(group);

				var wrapper = BoxWrapper.create().addToGroup(outter.box);
				wrapper.prin.delete();
				var biglambda = new BigLambda(name).addToGroup(wrapper); 
				wrapper.prin = biglambda;
				var box = this.toGraph(ast.body, wrapper.box);
				wrapper.auxs = wrapper.createPaxsOnTopOf(box.auxs);
				wrapper.updateNames(orig_name, name); 

				new Link(biglambda.key, box.prin.key, "n", "s").addToGroup(wrapper);
				outter.auxs = outter.createPaxsOnTopOf(wrapper.auxs);
				new Link(outter.prin.key, wrapper.prin.key, "n", "s").addToGroup(outter);
				return new Term(outter.prin, outter.auxs);
			}

			else if (ast instanceof NameInstantiation) {
				var term = this.toGraph(ast.body, group);
				var der = new Der(term.prin.name).addToGroup(group);
				var ins = new NameInstance(ast.name).addToGroup(group); 
				new Link(der.key, term.prin.key, "n", "s").addToGroup(group);
				new Link(ins.key, der.key, "n", "s").addToGroup(group);

				return new Term(ins, term.auxs);
			}

		}

		createNameAbstraction(node, f, name, group) { 
			var outter = BoxWrapper.create().addToGroup(group);

			var wrapper = BoxWrapper.create().addToGroup(outter.box);
			wrapper.prin.delete();
			var biglambda = new BigLambda(name).addToGroup(wrapper); 
			wrapper.prin = biglambda;
			var box = f(node, wrapper.box); 
			wrapper.auxs = wrapper.createPaxsOnTopOf(box.auxs);
			//wrapper.updateNames(orig_name, name); 

			new Link(biglambda.key, box.prin.key, "n", "s").addToGroup(wrapper);
			outter.auxs = outter.createPaxsOnTopOf(wrapper.auxs);
			new Link(outter.prin.key, wrapper.prin.key, "n", "s").addToGroup(outter);
			return new Term(outter.prin, outter.auxs);
		}

		createBinOp(node, group) {
			var wrapper1 = BoxWrapper.create().addToGroup(group);
			var abs1 = new Abs().addToGroup(wrapper1.box); 
			new Link(wrapper1.prin.key, abs1.key, "n", "s").addToGroup(wrapper1);

			var wrapper2 = BoxWrapper.create().addToGroup(wrapper1.box);
			var abs2 = new Abs().addToGroup(wrapper2.box);
			new Link(wrapper2.prin.key, abs2.key, "n", "s").addToGroup(wrapper2);

			node.addToGroup(wrapper2.box); 
			var vl = new Var('x').addToGroup(wrapper2.box);
			var vr = new Var('y').addToGroup(wrapper2.box);
			new Link(node.key, vl.key, "w", "s").addToGroup(wrapper2.box);
			new Link(node.key, vr.key, "e", "s").addToGroup(wrapper2.box);

			new Link(abs2.key, node.key, "e", "s").addToGroup(abs2.group);
			new Link(vr.key, abs2.key, "nw", "w", true).addToGroup(abs2.group);

			wrapper2.auxs = wrapper2.createPaxsOnTopOf([vl]);

			new Link(abs1.key, wrapper2.prin.key, "e", "s").addToGroup(abs1.group);
			new Link(wrapper2.auxs[0].key, abs1.key, "nw", "w", true).addToGroup(abs1.group);

			wrapper1.auxs = [];

			return new Term(wrapper1.prin, wrapper1.auxs); 
		}

		createUnOp(node, group) {
			var wrapper2 = BoxWrapper.create().addToGroup(group);
			var abs2 = new Abs().addToGroup(wrapper2.box);
			new Link(wrapper2.prin.key, abs2.key, "n", "s").addToGroup(wrapper2);

			node.addToGroup(wrapper2.box); 

			new Link(abs2.key, node.key, "e", "s").addToGroup(abs2.group);
			new Link(node.key, abs2.key, "nw", "w", true).addToGroup(abs2.group);

			wrapper2.auxs = [] 

			return new Term(wrapper2.prin, wrapper2.auxs);
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
				var evalToken = new MachineToken(this);
				evalToken.isMain = false;
				evalToken.setLink(cell.findLinksOutOf(null)[0]);
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
						this.token.rewriteFlag = RewriteFlag.F_STEP;
						this.token.foward = false;
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
				//console.log(nextLink);


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
				if (token.rewriteFlag == RewriteFlag.F_LAMBDA 
					|| token.rewriteFlag == RewriteFlag.F_RECUR
					|| token.rewriteFlag == RewriteFlag.F_STEP)
					target = token.link.to; 
				node = this.graph.findNodeByKey(target);
				var nextLink = node.rewrite(token, token.link);
				//console.log(nextLink);
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