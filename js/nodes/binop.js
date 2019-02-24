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
				 	var result = this.binOpApply(this.subType, l[0], r[0]);
				 	var type = (l[1] == CompData.EMPTY && r[1] == CompData.EMPTY) ? CompData.EMPTY : CompData.DEP;
					token.dataStack.push([result,type]);
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
				if (data[1] == CompData.EMPTY) { //left instanceof Promo && right instanceof Promo) {
					var wrapper = BoxWrapper.create().addToGroup(this.group);
					var newConst = new Const(token.dataStack.last()[0]).addToGroup(wrapper.box);
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

		copy() {
			var newNode = new BinOp(this.text);
			newNode.subType = this.subType;
			return newNode;
		}
	}

	return BinOp;
});