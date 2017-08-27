var graph = null;

class GoIMachine {
	
	constructor() {
		this.graph = new Graph();
		graph = this.graph; // cheating!
		this.token = new EvaluationToken(this);
		this.token.isMain = true;
		this.analysisToken = [];
		this.propTokens = [];
		this.rNodes = [];
		this.analysing = false;
		this.propagating = false;
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
		this.analysisToken = [];
		this.propTokens = [];
		this.rNodes = [];
		this.analysing = false;
		this.propagating = false;
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
			var derL = new Der(left.prin.name).addToGroup(group);
			new Link(derL.key, left.prin.key, "n", "s").addToGroup(group);
			var right = this.toGraph(ast.v2, group);
			var derR = new Der(right.prin.name).addToGroup(group);
			new Link(derR.key, right.prin.key, "n", "s").addToGroup(group);

			new Link(binop.key, derL.key, "w", "s").addToGroup(group);
			new Link(binop.key, derR.key, "e", "s").addToGroup(group);

			return new Term(binop, Term.joinAuxs(left.auxs, right.auxs, group));
		}

		else if (ast instanceof UnaryOp) {
			var unop = new UnOp(ast.name).addToGroup(group);
			unop.subType = ast.type;
			var box = this.toGraph(ast.v1, group);
			var der = new Der(box.prin.name).addToGroup(group);
			new Link(der.key, box.prin.key, "n", "s").addToGroup(group);

			new Link(unop.key, der.key, "n", "s").addToGroup(group);

			return new Term(unop, box.auxs);
		}

		else if (ast instanceof IfThenElse) {
			var ifnode = new If().addToGroup(group);
			var cond = this.toGraph(ast.cond, group);
			var der = new Der(cond.prin.name).addToGroup(group);
			new Link(der.key, cond.prin.key, "n", "s").addToGroup(group);
			var t1 = this.toGraph(ast.t1, group);
			var t2 = this.toGraph(ast.t2, group);

			new Link(ifnode.key, der.key, "w", "s").addToGroup(group);
			new Link(ifnode.key, t1.prin.key, "n", "s").addToGroup(group);
			new Link(ifnode.key, t2.prin.key, "e", "s").addToGroup(group);

			return new Term(ifnode, Term.joinAuxs(Term.joinAuxs(t1.auxs, t2.auxs, group), cond.auxs, group));
		}

		else if (ast instanceof Recursion) {
			var p1 = ast.p1
			var p2 = ast.p2;
			// recur term
			var wrapper = BoxWrapper.create().addToGroup(group);
			wrapper.prin.delete();
			var recur = new Recur().addToGroup(wrapper);
			wrapper.prin = recur;
			var box = this.toGraph(new Abstraction(p2, ast.body), wrapper.box);
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
		for (let node of group.nodes) {
			if (node instanceof Group)
				this.deleteVarNode(node);
			else if (node instanceof Var) 
				node.deleteAndPreserveOutLink();
		}
	}

	startAnalysis() {
		this.propagating = true;
		this.analysing = true;
		for (let rNode of this.rNodes) {
			var aToken = new AnalysisToken(this, rNode, this.graph.findNodeByKey(rNode).findLinksInto(null)[0]);
			this.analysisToken.push(aToken);
		}
	}

	startPropagation() {
		for (let rNode of this.rNodes) {
			var node = this.graph.findNodeByKey(rNode);
			var pToken = new PropToken(this, node.findLinksOutOf("e")[0]);
			this.propTokens.push(pToken);
			node.changeType(ModType.M);
		}
	}

	// machine step
	pass(flag, dataStack, boxStack) {	
		if (!finished) {
			this.count++;
			if (this.count == 200) {
				this.count = 0;
				this.gc.collect();
			}

			if (this.propagating) {
				if (this.analysing) {
					for (let token of Array.from(this.analysisToken)) {
						this.tokenPass(token, flag, dataStack, boxStack);
					}
					if (this.analysisToken.length == 0) {
						this.analysing = false;
						this.startPropagation();
					}
				}
				else {
					for (let token of Array.from(this.propTokens)) {
						if (token.evaluating) 
							this.tokenPass(token.evalToken, flag, dataStack, boxStack);
						
						this.tokenPass(token, flag, dataStack, boxStack);
					}
					if (this.propTokens.length == 0) {
						this.propagating = false;
					}
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

			if (token instanceof EvaluationToken) {
				token.rewrite = false;
				nextLink = node.transition(token, token.link);
				token.transited = true;
			}
			else if (token instanceof AnalysisToken) {
				nextLink = node.analyse(token);
				token.transited = false; // becoz there is no rewrite for this token
			}
			else if (token instanceof PropToken) {
				nextLink = node.propagate(token);
				token.transited = false;
			}

			if (nextLink != null) {
				token.setLink(nextLink);
				if (token.isMain) 
					this.printHistory(token, flag, dataStack, boxStack); 
				else if (token instanceof EvaluationToken && !token.isMain)
					//console.log(token);
					//this.printHistory(token, flag, dataStack, boxStack);
					;
			}
			else {
				token.setLink(null);
				token.transited = false;
				if (token.isMain) {
					this.gc.collect();
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
					var nextNode = this.graph.findNodeByKey(token.forward ? token.link.to : token.link.from);
					nextLink = nextNode.rewrite(token, nextLink);
					if (!token.rewrite) {
						token.transited = false;
						this.tokenPass(token, flag, dataStack, boxStack);
					}
					else {
						token.setLink(nextLink);
						if (token.isMain)
							this.printHistory(token, flag, dataStack, boxStack);
						else
							//console.log(token);
							//this.printHistory(token, flag, dataStack, boxStack);
							;
					}
				}
				else {
					token.setLink(nextLink);
					if (token.isMain)
						this.printHistory(token, flag, dataStack, boxStack);
					else
						//console.log(token);
						//this.printHistory(token, flag, dataStack, boxStack);
						;
				}
			}
		}
	}

	printHistory(token, flag, dataStack, boxStack) {
		var modStr = token.modStack.length == 0 ? '□' : Array.from(token.modStack).reverse().toString() + ',□';
		flag.val(token.rewriteFlag + '\t' + modStr + '\n' + flag.val());
		var dataStr = token.dataStack.length == 0 ? '□' : Array.from(token.dataStack).reverse().toString() + ',□';
		dataStack.val(dataStr + '\n' + dataStack.val());
		var boxStr = token.boxStack.length == 0 ? '□' : Array.from(token.boxStack).reverse().toString() + ',□';
		boxStack.val(boxStr + '\n' + boxStack.val());
	}

}

define('goi-machine', ['gc', 'graph', 'node', 'group', 'link', 'term', 'token', 'token_a', 'token_p', 'op', 'parser/ast', 'parser/token', 'parser/lexer', 'parser/parser'
					, 'nodes/expo', 'nodes/abs', 'nodes/app', 'nodes/binop', 'nodes/const', 'nodes/contract'
					, 'nodes/der', 'nodes/if', 'nodes/if1', 'nodes/if2', 'nodes/pax', 'nodes/promo'
					, 'nodes/recur', 'nodes/start', 'nodes/unop', 'nodes/weak', 'nodes/prov', 'nodes/mod', 'nodes/delta', 'nodes/prop'],
	function() {
		return new GoIMachine();	
	}
);