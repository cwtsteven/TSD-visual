define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var BinOpType = require('op').BinOpType;
	var Weak = require('nodes/weak');
	var Pair = require('token').Pair();

	class BinOp extends Node {

		constructor(text) {
			super(null, text, "mediumpurple1");
			this.subType = null;
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "e") {
				var nextLink = this.findLinksOutOf("w")[0];
				token.dataStack.push(CompData.PROMPT);
				token.forward = true;
				return nextLink;
			}
			else if (link.from == this.key && link.fromPort == "w") {
				if (token.dataStack[token.dataStack.length-3] == CompData.PROMPT) { 
					var l = token.dataStack.pop();
					var r = token.dataStack.pop();
				 			token.dataStack.pop();
				 	var result = this.binOpApply(this.subType, l.a, r.a);
				 	var type = (l.b == CompData.EMPTY && r.b == CompData.EMPTY) ? CompData.EMPTY : CompData.DEP;
					token.dataStack.push(new Pair(result,type));
					token.rewriteFlag = RewriteFlag.F_OP;	
					return this.findLinksInto(null)[0];;
				}	
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
					var weak = new Weak().addToGroup(this.group);
					new Link(weak.key, left.key, "n", "s").addToGroup(this.group);
					var weak = new Weak().addToGroup(this.group);
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
				case BinOpType.And: return v1 && v2;
				case BinOpType.Or: return v1 || v2;
				case BinOpType.Plus: return parseFloat(v1) + parseFloat(v2);
				case BinOpType.Sub: return parseFloat(v1) - parseFloat(v2);
				case BinOpType.Mult: return parseFloat(v1) * parseFloat(v2);
				case BinOpType.Div: return parseFloat(v1) / parseFloat(v2);
				case BinOpType.Lte: return parseFloat(v1) <= parseFloat(v2);
				case BinOpType.VecPlus: 
					if (v1.length != v2.length)
						return null;
					var result = [];
					for (var i=0; i<v1.length; i++) {
						result[i] = (v1[i] + v2[i]);
					}
					return result;
				case BinOpType.VecMult:
					var result = [];
					for (var i=0; i<v2.length; i++) {
						result[i] = (v1 * v2[i]);
					}
					return result;
				case BinOpType.VecDot:
					if (v1.length != v2.length)
						return null;
					var result = 0;
					for (var i=0; i<v1.length; i++) {
						result += v1[i] * v2[i];
					}
					return result;
			}
		}

		static createPlus() {
			var node = new BinOp("+");
			node.subType = BinOpType.Plus;
			return node;
		}

		static createMult() {
			var node = new BinOp("*");
			node.subType = BinOpType.Mult;
			return node;
		}

		static createPlus() {
			var op = new VecBinOp('⊞');
			op.subType = BinOpType.VecPlus;
			return op;
		}

		static createMult() {
			var op = new VecBinOp('⊠');
			op.subType = BinOpType.VecMult;
			return op;
		}

		static createDot() {
			var op = new VecBinOp('⊡');
			op.subType = BinOpType.VecDot;
			return op;
		}

		copy() {
			var newNode = new BinOp(this.text);
			newNode.subType = this.subType;
			return newNode;
		}
	}

	return BinOp;
});