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
	var App = require('nodes/app');
	var Der = require('nodes/der');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class Fold extends Node {

		constructor() {
			super(null, 'F', "mediumpurple1");
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
					token.dataStack.push(new Pair([],CompData.EMPTY));
					token.rewriteFlag = RewriteFlag.F_FOLD+r.a.length;	
					return this.findLinksInto(null)[0];;
				}	
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag.substring(0,3) == RewriteFlag.F_FOLD && nextLink.to == this.key) {
				var len = parseInt(token.rewriteFlag.substring(3));
				token.rewriteFlag = RewriteFlag.EMPTY;
				token.dataStack.pop();
				token.dataStack.push(CompData.PROMPT);

				var left = this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to);
				var right = this.graph.findNodeByKey(this.findLinksOutOf("e")[0].to);

				if (len == 0) {
					var weak = new Weak().addToGroup(this.group);
					new Link(weak.key, left.key, "n", "s").addToGroup(this.group);
					this.findLinksInto(null)[0].changeTo(right.key);
					this.delete();
				}
				else {
					var node = this.aux(len, len);
					this.findLinksInto(null)[0].changeTo(node[0].key, "s");
					this.findLinksOutOf("w")[0].changeFrom(node[1].key, "n");
					this.delete();
				}
				
				token.forward = true;
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		generateBaseVector(size, i) {
			var vector = new Array(size).fill(0);
			vector[i] = 1;
			return vector;
		}

		aux(n, i) {
			var app1 = new App().addToGroup(this.group);
			var app2 = new App().addToGroup(this.group);
			var der1 = new Der().addToGroup(this.group);
			var der2 = new Der().addToGroup(this.group);
			var wrapper = BoxWrapper.create().addToGroup(this.group);
			var constant = new Const(this.generateBaseVector(n,(n-i))).addToGroup(wrapper.box);
			new Link(wrapper.prin.key, constant.key, "n", "s").addToGroup(wrapper);

			new Link(app1.key, der1.key, "w", "s").addToGroup(this.group);
			new Link(der1.key, app2.key, "n", "s").addToGroup(this.group);
			new Link(app2.key, der2.key, "w", "s").addToGroup(this.group);
			new Link(app2.key, wrapper.prin.key, "e", "s").addToGroup(this.group);

			if (i == 1) {	
				new Link(app1.key, this.findLinksOutOf("e")[0].to, "e", "s").addToGroup(this.group);
				return [app1, der2];
			}

			else {
				var next = this.aux(n, i-1);
				new Link(app1.key, next[0].key, "e", "s").addToGroup(this.group);
				var con = new Contract().addToGroup(this.group);
				new Link(der2.key, con.key, "n", "s").addToGroup(this.group);
				new Link(next[1].key, con.key, "n", "s").addToGroup(this.group);
				return [app1, con];
			}

		}

		copy() {
			var newNode = new Fold();
			return newNode;
		}
	}

	return Fold;
});