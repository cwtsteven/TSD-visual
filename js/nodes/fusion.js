define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var BoxWrapper = require('box-wrapper');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var Projection = require('nodes/proj');
	var Const = require('nodes/const');
	var Contract = require('nodes/contract');
	var Param = require('nodes/param');
	var ProvCon = require('nodes/pc');
	var Weak = require('nodes/weak');
	var Pair = require('token').Pair();

	class Fuse extends Node {

		constructor() {
			super(null, "f","indianred1");
		}
		
		transition(token, link) { 
			if (link.to == this.key && link.toPort == "s") {
				var nextLink = this.findLinksOutOf("n")[0];
				token.rewriteFlag = RewriteFlag.F_FUSE;
				return nextLink; 
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_FUSE && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				nextLink = this.aux(this);
					
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		aux(node) {
			var vec = new Param().addToGroup(this.group);
			var con = new Contract().addToGroup(this.group);
			new Link(con.key, vec.key, "n", "s").addToGroup(this.group);
			var index = 0;
			var nodes = [node];
			while (nodes.length != 0) {
				var node = nodes.pop();
				if (node instanceof ProvCon) {
					var c = new Const(node.data).addToGroup(this.group);
					new Link(vec.key, c.key, "n", "s").addToGroup(this.group);
					var proj = new Projection(index).addToGroup(this.group);
					index++;
					new Link(proj.key, con.key, "n", "s").addToGroup(this.group);
					node.findLinksInto(null)[0].changeTo(proj.key,"s");
					node.delete();
				}
				else if (node instanceof Projection) {
					var proj = new Projection(index).addToGroup(this.group);
					index++;
					new Link(proj.key, con.key, "n", "s").addToGroup(this.group);
					node.findLinksInto(null)[0].changeTo(proj.key,"s");
					new Link(vec.key, node.key, "n", "s").addToGroup(this.group);
				}
				else if (node instanceof Promo) {
					nodes = nodes.concat(promo.group.auxs);
				}
				else {
					var newNodes = [];
					var links = node.findLinksOutOf(null);
					var i;
					for (i=0; i<links.length; i++) {
						newNodes[i] = this.graph.findNodeByKey(links[i].to);
					}
					nodes = nodes.concat(newNodes);
				}
			}
			var nextLink = this.findLinksInto(null)[0];
			nextLink.changeTo(con.key,"s");

			var weak = new Weak().addToGroup(this.group);
			this.findLinksOutOf(null)[0].changeFrom(weak.key,"n");
			this.delete()
			return nextLink;
		}

		copy() {
			return new Fuse();
		}
	}

	return Fuse;
});