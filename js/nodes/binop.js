define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var Token = require('parser/token');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class BinOp extends Node {

		constructor(op, subType, hasPname, pname) {
			super(null, op, "mediumpurple1");
			this.subType = subType;
			this.op = op; 
			this.hasPname = hasPname;
			this.updatePName(pname);
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				//token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "e") {
				var nextLink = this.findLinksOutOf("w")[0];
				token.dataStack.push(CompData.PROMPT);
				token.forward = true;
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "w") {
				var l = token.dataStack.pop();
				var r = token.dataStack.pop();
			 	//		token.dataStack.pop();
			 	var result = this.binOpApply(this.subType, l.a, r.a);
			 	var type = (l.b == CompData.EMPTY && r.b == CompData.EMPTY) ? CompData.EMPTY : CompData.DEP;
				token.dataStack.push(new Pair(result,type));
				token.rewriteFlag = RewriteFlag.F_OP;	
				return this.findLinksInto(null)[0];;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_OP && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				var right = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);
				var data = token.dataStack.last();
				if (data.b == CompData.EMPTY) { //left instanceof Promo && right instanceof Promo) {
					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(token.dataStack.last().a).addToGroup(wrapper.box);
					new Link(wrapper.prin.key, newConst.key, "n", "s").addToGroup(wrapper);
					nextLink.changeTo(wrapper.prin.key, "s");
					
					//left.group.delete();
					//right.group.delete();
					var weak = new Contract().addToGroup(this.group);
					new Link(weak.key, left.key, "n", "s").addToGroup(this.group);
					var weak = new Contract().addToGroup(this.group);
					new Link(weak.key, right.key, "n", "s").addToGroup(this.group);
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

		binOpApply(type, v1, v2) {
			switch(type) {
				case Token.AND: return v1 && v2;
				case Token.OR: return v1 || v2;
				case Token.PLUS: return parseFloat(v1) + parseFloat(v2);
				case Token.SUB: return parseFloat(v1) - parseFloat(v2);
				case Token.MULT: return parseFloat(v1) * parseFloat(v2);
				case Token.DIV: return parseFloat(v1) / parseFloat(v2);
				case Token.MOD: return parseFloat(v1) % parseFloat(v2);
				case Token.LTE: return parseFloat(v1) <= parseFloat(v2);
				case Token.NEQ: return parseFloat(v1) != parseFloat(v2);
				case Token.VECPLUS: 
					if (v1.length != v2.length)
						return null;
					var result = [];
					for (var i=0; i<v1.length; i++) {
						result[i] = parseFloat(v1[i]) + parseFloat(v2[i]); 
					}
					return result;
				case Token.VECMULT:
					var result = [];
					for (var i=0; i<v2.length; i++) {
						result[i] = parseFloat(v1) * parseFloat(v2[i]);
					}
					return result;
				case Token.VECDOT:
					if (v1.length != v2.length)
						return null;
					var result = 0;
					for (var i=0; i<v1.length; i++) {
						result += parseFloat(v1[i]) * parseFloat(v2[i]);
					}
					return result;
			}
		}

		updatePName(pname) {
			if (this.hasPname) { 
				this.pname = pname; 
				this.text = this.op+"("+pname+")";
			}
		}

		copy() {
			var newNode = new BinOp(this.text, this.subType, this.hasPname, this.paname);
			return newNode;
		}
	}

	return BinOp;
});