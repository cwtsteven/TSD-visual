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

class GoIMachine {
	
	constructor() {
		this.graph = new Graph(this);
		graph = this.graph; // cheating!
		this.token = new EvaluationToken(this);
		this.token.isMain = true;
		this.evalTokens = [];
		this.cells = [];
		this.readyEvalTokens = 0;
		this.evaluating = false;
		this.updating = false;
		this.hasUpdate = false;
		this.gc = new GC(this.graph);
		this.count = 0;
	}

	compile(source) {
		const lexer = new Lexer(source + '\0');
		const parser = new Parser(lexer);
		const ast = parser.parse();
		// init
		this.graph.clear();
		this.token.reset();
		this.evalTokens = [];
		this.cells = [];
		this.readyEvalTokens = 0;
		this.evaluating = false;
		this.updating = false;
		this.hasUpdate = false;
		this.count = 0;
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
			var v = new Var(ast.name).addToGroup(group)
			return new Term(v, [v]);
		} 

		else if (ast instanceof Abstraction) {
			var param = ast.param;
			var wrapper = BoxWrapper.create().addToGroup(group);
			var abs = new Abs().addToGroup(wrapper.box);
			var term = this.toGraph(ast.body, wrapper.box);
			new Link(wrapper.prin.key, abs.key, "n", "s").addToGroup(wrapper);

			new Link(abs.key, term.prin.key, "e", "s").addToGroup(abs.group);

			var auxs = Array.from(term.auxs);
			var paramUsed = false;
			var auxNode;
			for (let aux of term.auxs) {
				if (aux.name == param) {
					paramUsed = true;
					auxNode = aux;
					break;
				}
			}
			if (paramUsed) {
				auxs.splice(auxs.indexOf(auxNode), 1);
			} else {
				auxNode = new Weak(param).addToGroup(abs.group);
			}
			new Link(auxNode.key, abs.key, "nw", "w", true).addToGroup(abs.group);

			wrapper.auxs = wrapper.createPaxsOnTopOf(auxs);

			return new Term(wrapper.prin, wrapper.auxs);
		} 

		/*
		else if (ast instanceof ProvApplication) {
			var app = new App().addToGroup(group);
			//lhs
			var left = this.toGraph(ast.lhs, group);

			var der = new Der(left.prin.name).addToGroup(group);
			new Link(der.key, left.prin.key, "n", "s").addToGroup(group);
			// rhs
			var right = this.toGraph(ast.rhs, group);	
			var prov = new Prov().addToGroup(group);
			new Link(prov.key, right.prin.key, "n", "s").addToGroup(group);
			
			new Link(app.key, der.key, "w", "s").addToGroup(group);
			new Link(app.key, prov.key, "e", "s").addToGroup(group);

			return new Term(app, Term.joinAuxs(left.auxs, right.auxs, group));
		} 
		*/

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
			wrapper.auxs = Array.from(box.auxs);
			recur.box = box;

			new Link(recur.key, box.prin.key, "e", "s").addToGroup(wrapper);

			var p1Used = false;
			var auxNode1;
			for (var i=0; i<wrapper.auxs.length; i++) {
				var aux = wrapper.auxs[i];
				if (aux.name == p1) {
					p1Used = true;
					auxNode1 = aux;
					break;
				}
			}
			if (p1Used) {
				wrapper.auxs.splice(wrapper.auxs.indexOf(auxNode1), 1);
			} else {
				auxNode1 = new Weak(p1).addToGroup(wrapper.box);
			}
			new Link(auxNode1.key, recur.key, "nw", "w", true).addToGroup(wrapper);

			return new Term(wrapper.prin, wrapper.auxs);
		}

		else if (ast instanceof ProvisionalConstant) {
			var term = this.toGraph(ast.term, group);
			var prov = new Prov().addToGroup(group);
			new Link(prov.key, term.prin.key, "n", "s").addToGroup(group);
			return new Term(prov, term.auxs);
		}

		else if (ast instanceof Deprecate) {
			var term = this.toGraph(ast.term, group);
			var dep = new Dep().addToGroup(group);
			new Link(dep.key, term.prin.key, "n", "s").addToGroup(group);
			return new Term(dep, term.auxs);
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

		else if (ast instanceof Propagation) {
			var prop = new Prop().addToGroup(group);
			return new Term(prop, []);
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
			var evalToken = new EvaluationToken(this);
			evalToken.setLink(cell.findLinksOutOf('e')[0]);
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
				if (this.readyEvalTokens == this.evalTokens.length) {
					this.evaluating = false;
					this.updating = true;
					this.readyEvalTokens = 0;
					return;
				}
			}

			else if (this.updating) {
				if (this.evalTokens.length == 0) {
					this.updating = false;
					return;
				}
				this.batchPass(this.evalTokens);
			}

			else
				this.tokenPass(this.token, flag, dataStack, boxStack, modStack);
		}
	}

	tokenPass(token, flag, dataStack, boxStack, modStack) {
		var node;
		if (!token.transited) {
			if (token.link != null) {
				var target = token.forward ? token.link.to : token.link.from;
				node = this.graph.findNodeByKey(target);
			}
			else 
				node = this.graph.findNodeByKey("nd1");
			
			var nextLink;

			if (token instanceof EvaluationToken) {
				token.rewrite = false;
				nextLink = node.transition(token, token.link);
				token.transited = true;
			}
			else if (token instanceof PropToken) {
				nextLink = node.propagate(token);
				token.transited = false;
			}

			if (nextLink != null) {
				token.setLink(nextLink);
				if (token.isMain) 
					this.printHistory(token, flag, dataStack, boxStack, modStack); 
				else if (token instanceof EvaluationToken && !token.isMain)
					//console.log(token);
					//this.printHistory(token, flag, dataStack, boxStack);
					;
			}
			else {
				token.setLink(null);
				token.transited = false;
				if (token.isMain) {
					//this.gc.collect();
					play = false;
					playing = false;
					finished = true;
				}
			}
		}
		else {
			if (token instanceof EvaluationToken) {
				var target = token.forward ? token.link.from : token.link.to;
				node = this.graph.findNodeByKey(target);
				var nextLink = node.rewrite(token, token.link);
				if (!token.rewrite) {
					token.transited = false;
					this.tokenPass(token, flag, dataStack, boxStack, modStack);
				}
				else {
					token.setLink(nextLink);
					if (token.isMain)
						this.printHistory(token, flag, dataStack, boxStack, modStack);
					else
						//console.log(token);
						//this.printHistory(token, flag, dataStack, boxStack, modStack);
						;
				}
			}
		}
	}

	printHistory(token, flag, dataStack, boxStack, modStack) {
		flag.val(token.rewriteFlag + '\n' + flag.val());
		var dataStr = token.dataStack.length == 0 ? '□' : Array.from(token.dataStack).reverse().toString() + ',□';
		dataStack.val(dataStr + '\n' + dataStack.val());
		var boxStr = token.boxStack.length == 0 ? '□' : Array.from(token.boxStack).reverse().toString() + ',□';
		boxStack.val(boxStr + '\n' + boxStack.val());
		//var modStr = token.copyStack.length == 0 ? '□' : Array.from(token.copyStack).reverse().toString() + ',□';
		//modStack.val(modStr + '\n' + modStack.val());
	}

}

define('goi-machine', 
	function(require) {
		require('gc');
		require('node');
		require('group');
		require('graph');
		require('link');
		require('term');
		require('token');
		require('op');
		require('parser/ast');
		require('parser/token');
		require('parser/lexer');
		require('parser/parser');
		require('nodes/expo');
		require('nodes/abs');
		require('nodes/app');
		require('nodes/binop');
		require('nodes/const');
		require('nodes/contract');
		require('nodes/der');
		require('nodes/if');
		require('nodes/pax');
		require('nodes/promo');
		require('nodes/recur');
		require('nodes/start');
		require('nodes/unop');
		require('nodes/weak');
		require('nodes/prov');
		require('nodes/dep');
		require('nodes/mod');
		require('nodes/delta');
		require('nodes/prop');
		return new GoIMachine();	
	}
);