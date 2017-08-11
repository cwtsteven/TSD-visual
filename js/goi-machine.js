var graph = null;

class GoIMachine {
	
	constructor() {
		this.graph = new Graph();
		graph = this.graph; // cheating!
		this.token = new MachineToken();
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
		this.count = 0;
		// create graph
		var start = new Start().addToGroup(this.graph.child);
		var term = this.toGraph(ast, this.graph.child);
		new Link(start.key, term.prin.key, term.prin.name, "n", "s").addToGroup(this.graph.child);
		this.token.next = start.key;
	}

	// translation
	toGraph(ast, group) {
		var graph = this.graph;

		if (ast instanceof Identifier) {
			var der = new Der(ast.name).addToGroup(group);
			return new Term(der, [der]);
		} 

		else if (ast instanceof Abstraction) {
			var param = ast.param;
			var abs = new Abs().addToGroup(group);
			var wrapper = BoxWrapper.create().addToGroup(group);
			var term = this.toGraph(ast.body, wrapper.box);
			wrapper.auxs = wrapper.createPaxsOnTopOf(term.auxs);

			var der = new Der().addToGroup(group);
			new Link(wrapper.prin.key, term.prin.key, term.prin.name, "n", "s").addToGroup(wrapper);
			new Link(der.key, wrapper.prin.key, wrapper.prin.name, "n", "s").addToGroup(group);
			new Link(abs.key, der.key, term.prin.name, "e", "s").addToGroup(group);

			var auxs = Array.from(wrapper.auxs);
			var paramUsed = false;
			var auxNode;
			for (let aux of wrapper.auxs) {
				if (aux.name == param) {
					paramUsed = true;
					auxNode = aux;
					break;
				}
			}
			if (paramUsed) {
				auxs.splice(auxs.indexOf(auxNode), 1);
			} else {
				auxNode = new Weak(param).addToGroup(group);
			}
			new Link(auxNode.key, abs.key, param, "nw", "w", true).addToGroup(group);

			return new Term(abs, auxs);
		} 

		else if (ast instanceof Application) {
			var app = new App().addToGroup(group);
			//lhs
			var left = this.toGraph(ast.lhs, group);
			// rhs
			var wrapper = BoxWrapper.create().addToGroup(group);
			var right = this.toGraph(ast.rhs, wrapper.box);		
			new Link(wrapper.prin.key, right.prin.key, right.prin.name, "n", "s").addToGroup(wrapper);
			wrapper.auxs = wrapper.createPaxsOnTopOf(right.auxs);
			
			new Link(app.key, left.prin.key, left.prin.name, "w", "s").addToGroup(group);
			new Link(app.key, wrapper.prin.key, right.prin.name, "e", "s").addToGroup(group);

			return new Term(app, Term.joinAuxs(left.auxs, wrapper.auxs, group));
		} 

		else if (ast instanceof Constant) {
			var constant = new Const(ast.value).addToGroup(group);
			return new Term(constant, []);
		}

		else if (ast instanceof BinaryOp) {
			var binop = new BinOp(ast.name).addToGroup(group);

			binop.subType = ast.type;
			var left = this.toGraph(ast.v1, group);
			var right = this.toGraph(ast.v2, group);

			new Link(binop.key, left.prin.key, left.prin.name, "w", "s").addToGroup(group);
			new Link(binop.key, right.prin.key, right.prin.name, "e", "s").addToGroup(group);

			return new Term(binop, Term.joinAuxs(left.auxs, right.auxs, group));
		}

		else if (ast instanceof UnaryOp) {
			var unop = new UnOp(ast.name).addToGroup(group);
			unop.subType = ast.type;
			var box = this.toGraph(ast.v1, group);

			new Link(unop.key, box.prin.key, box.prin.name, "n", "s").addToGroup(group);

			return new Term(unop, box.auxs);
		}

		else if (ast instanceof IfThenElse) {
			var ifnode = new If().addToGroup(group);
			var cond = this.toGraph(ast.cond, group);
			var t1 = this.toGraph(ast.t1, group);
			var t2 = this.toGraph(ast.t2, group);

			new Link(ifnode.key, cond.prin.key, cond.prin.name, "w", "s").addToGroup(group);
			new Link(ifnode.key, t1.prin.key, t1.prin.name, "n", "s").addToGroup(group);
			new Link(ifnode.key, t2.prin.key, t2.prin.name, "e", "s").addToGroup(group);

			return new Term(ifnode, Term.joinAuxs(cond.auxs, Term.joinAuxs(t1.auxs, t2.auxs, group), group));
		}

		else if (ast instanceof Recursion) {
			var p1 = ast.p1
			var p2 = ast.p2;
			// recur term
			var recurWrapper = BoxWrapper.create().addToGroup(group);
			recurWrapper.prin.delete();
			var recur = new Recur().addToGroup(recurWrapper);
			recurWrapper.prin = recur;
			var abs = new Abs().addToGroup(recurWrapper.box);
			var promoWrapper = BoxWrapper.create().addToGroup(recurWrapper.box);
			var box = this.toGraph(ast.body, promoWrapper.box);
			promoWrapper.auxs = promoWrapper.createPaxsOnTopOf(box.auxs);
			var der = new Der().addToGroup(recurWrapper.box);
			new Link(promoWrapper.prin.key, box.prin.key, box.prin.name, "n", "s").addToGroup(promoWrapper);
			new Link(der.key, promoWrapper.prin.key, promoWrapper.prin.name, "n", "s").addToGroup(recurWrapper.box);
			new Link(abs.key, der.key, box.prin.name, "e", "s").addToGroup(recurWrapper.box);

			new Link(recurWrapper.prin.key, abs.key, abs.name, "e", "s").addToGroup(recurWrapper);

			var auxs = Array.from(promoWrapper.auxs);
			var p1Used = false;
			var p2Used = false;
			var auxNode1;
			var auxNode2;
			for (var i=0; i<auxs.length; i++) {
				var aux = auxs[i];
				if (aux.name == p1) {
					p1Used = true;
					auxNode1 = aux;
				}
				if (aux.name == p2) {
					p2Used = true;
					auxNode2 = aux;
				}
				if (p1Used && p2Used)
					break;
			}
			if (p1Used) {
				auxs.splice(auxs.indexOf(auxNode1), 1);
			} else {
				auxNode1 = new Weak(p1).addToGroup(recurWrapper.box);
			}
			if (p2Used) {
				auxs.splice(auxs.indexOf(auxNode2), 1);
			} else {
				auxNode2 = new Weak(p2).addToGroup(recurWrapper.box);
			}
			new Link(auxNode1.key, recurWrapper.prin.key, p1, "nw", "w", true).addToGroup(promoWrapper);
			new Link(auxNode2.key, abs.key, p1, "nw", "w", true).addToGroup(recurWrapper.box);

			return new Term(recurWrapper.prin, auxs);
		}
	}

	// machine step
	pass(flag, dataStack, boxStack) {	
		this.count++;
		if (this.count == 200) {
			this.count = 0;
			this.gc.collect();
		}

		var node;
		if (!this.token.transited) {
			this.token.at = this.token.next;
			node = this.graph.findNodeByKey(this.token.at);
			this.token.rewrite = false;
			var nextLink = node.transition(this.token, this.token.link);
			this.printHistory(flag, dataStack, boxStack); 
			if (nextLink != null) {
				this.token.setLink(nextLink);
				this.token.transited = true;
			}
			else {
				this.gc.collect();
				this.token.setLink(null);
				play = false;
				playing = false;
				finished = true;
			}
		}
		else {
			node = this.graph.findNodeByKey(this.token.at);
			var nextLink = node.rewrite(this.token, this.token.link);
			if (!this.token.rewrite) {
				this.token.transited = false;
				this.pass(flag, dataStack, boxStack);
			}
			else {
				this.token.setLink(nextLink);
				this.printHistory(flag, dataStack, boxStack);
			}
		}
	}

	printHistory(flag, dataStack, boxStack) {
		flag.val(this.token.rewriteFlag + '\n' + flag.val());
		var dataStr = this.token.dataStack.length == 0 ? '□' : Array.from(this.token.dataStack).reverse().toString() + ',□';
		dataStack.val(dataStr + '\n' + dataStack.val());
		var boxStr = this.token.boxStack.length == 0 ? '□' : Array.from(this.token.boxStack).reverse().toString() + ',□';
		boxStack.val(boxStr + '\n' + boxStack.val());
		//console.log(this.graph.allNodes);
	}

}

define('goi-machine', ['gc', 'graph', 'node', 'group', 'link', 'term', 'token', 'op', 'parser/ast', 'parser/token', 'parser/lexer', 'parser/parser'
					, 'nodes/expo', 'nodes/abs', 'nodes/app', 'nodes/binop', 'nodes/const', 'nodes/contract'
					, 'nodes/der', 'nodes/if', 'nodes/pax', 'nodes/promo'
					, 'nodes/recur', 'nodes/start', 'nodes/unop', 'nodes/weak'],
	function() {
		return new GoIMachine();	
	}
);