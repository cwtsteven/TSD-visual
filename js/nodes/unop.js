define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Token = require('parser/token');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class UnOp extends Node {

		constructor(op, subType, hasPname, pname) {
			super(null, op, "mediumpurple1");
			this.subType = subType;
			this.op = op;
			this.hasPname = hasPname;
			this.updatePName(pname);
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				//token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				var v1 = token.dataStack.pop();
				//		 token.dataStack.pop();
				var type = (v1.b == CompData.EMPTY) ? CompData.EMPTY : CompData.DEP;
				token.dataStack.push(new Pair(this.unOpApply(this.subType, v1.a),CompData.EMPTY));
				token.rewriteFlag = RewriteFlag.F_OP;
				return this.findLinksInto(null)[0];
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_OP && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				
				var prev = this.graph.findNodeByKey(this.findLinksOutOf(null)[0].to); 
				var data = token.dataStack.last();
				if (data.b == CompData.EMPTY) { //if (prev instanceof Promo) {
					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(token.dataStack.last()[0]).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
					nextLink.changeTo(wrapper.prin.key, "s");
					//prev.group.delete(); 
					var weak = new Contract().addToGroup(this.group);
					new Link(weak.key, prev.key, "n", "s").addToGroup(this.group);
					this.delete(); 
				}
				
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		unOpApply(type, v1) {
			switch(type) {
				case Token.NOT: return !v1;
			}
		}

		updatePName(pname) {
			if (this.hasPname) {
				this.pname = pname; 
				this.text = this.op+"("+pname+")";
			}
		}

		copy() {
			var newNode = new UnOp(this.op, this.subType, this.hasPname. this.pname);
			return newNode;
		}

	}

	return UnOp;
});