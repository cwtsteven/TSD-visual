define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var BoxWrapper = require('box-wrapper');
	var Const = require('nodes/const');
	var Link = require('link');
	var Weak = require('nodes/weak');
	var ProvCon = require('nodes/pc');
	var Const = require('nodes/const');
	var Param = require('nodes/param');
	var Projection = require('nodes/proj');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();

	class Set extends Node {

		constructor() {
			super(null, "a", "indianred1");
			this.rKey = null;
			this.data = null;
		}
		
		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("e")[0];
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				if (link.fromPort == "e") {
					var nextLink = this.findLinksOutOf("w")[0];
					//token.dataStack.pop();
					token.dataStack.push(CompData.PROMPT);
					token.forward = true; 
					return nextLink;
				}
				else if (link.fromPort == "w") {
					if (token.dataStack[token.dataStack.length-3] == CompData.PROMPT) {
						var data = token.dataStack.pop();
						var new_v = token.dataStack.pop();
						token.dataStack.pop();
						token.dataStack.push(new Pair(CompData.UNIT,CompData.EMPTY));
						this.rKey = data.b;
						this.data = new_v.a;
						token.rewriteFlag = RewriteFlag.F_ASSIGN + this.rKey +';'+ this.data;
						return this.findLinksInto(null)[0];
					}
				}
			}
		}

		rewrite(token, nextLink) { 
			if (token.rewriteFlag.substring(0,3) == RewriteFlag.F_ASSIGN && nextLink.to == this.key) {
				var key = this.rKey;
				var data = this.data;
				token.rewriteFlag = RewriteFlag.EMPTY;

				if (key == CompData.DEP) {
					for (var i=0; i<data.length; i++) {
						this.update(this.graph.findNodeByKey(this.findLinksOutOf("w")[0].to),i,data[i]);
					}
				}
				else {
					var mod = this.graph.findNodeByKey(key);
					mod.update(data);
				}
				var weak1 = new Weak().addToGroup(this.group);
				this.findLinksOutOf("w")[0].changeFrom(weak1.key, "n");
				var weak2 = new Weak().addToGroup(this.group);
				this.findLinksOutOf("e")[0].changeFrom(weak2.key, "n");

				var wrapper = BoxWrapper.create().addToGroup(this.group);
				var con = new Const(token.dataStack.last().a).addToGroup(wrapper.box);
				new Link(wrapper.prin.key, con.key, "n", "s").addToGroup(wrapper);
				this.findLinksInto(null)[0].changeTo(wrapper.prin.key, "s");

				this.delete();
				
				token.rewrite = true;
				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		update(node, k, n) {
			var k;
			while (true) {
				if (node instanceof Const) {
					node.name = n;
					node.text = n;
					break;
				}
				else if (node instanceof Projection) {
					k = node.index;
					node = this.graph.findNodeByKey(node.findLinksOutOf(null)[0].to);
				}
				else if (node instanceof Param) {
					node = this.graph.findNodeByKey(node.findLinksOutOf(null)[k].to);
				}
				else if (node instanceof Contract) {
					node = this.graph.findNodeByKey(node.findLinksOutOf(null)[0].to);
				}
			}
		}

		copy() {
			return new Set();
		}
	}

	return Set;
});