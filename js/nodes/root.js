define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var Contract = require('nodes/contract');
	var Pair = require('token').Pair();
	var Promo = require('nodes/promo');


	class Root extends Node {
		
		constructor() {
			super(null, 'r', "mediumpurple1");
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0]; 
				//token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				var data = token.dataStack.pop();
				//token.dataStack.pop();
				token.dataStack.push(new Pair(data.a,CompData.EMPTY));
				token.rewriteFlag = RewriteFlag.F_ROOT;
				token.payload = data;
				return this.findLinksInto(null)[0]; 
			}
		}

		rewrite(token, nextLink) {
			if (nextLink.to == this.key && token.rewriteFlag == RewriteFlag.F_ROOT) {
				token.rewriteFlag = RewriteFlag.EMPTY;
				token.dataStack.pop();
				token.dataStack.push(CompData.PROMPT);

				var key = token.payload.b; 
				token.payload = null;
				var cell = this.graph.findNodeByKey(key);

				var cellout = cell.findLinksOutOf(null)[0];
				var upnode = this.graph.findNodeByKey(cellout.to);

				if (upnode instanceof Promo) {
					var newBox = upnode.group.copy().addToGroup(this.group);
					nextLink.changeTo(newBox.prin.key, "s"); 
				}
				else if (upnode instanceof Contract) {
					nextLink.changeTo(upnode.key, "s"); 
				}
				else {
					var con = new Contract().addToGroup(upnode.group);
					cellout.changeFrom(con.key, "n");
					new Link(cell.key, con.key, "n", "s").addToGroup(cell.group);
					nextLink.changeTo(con.key, "s"); 
				}

				var outLink = this.findLinksOutOf(null)[0]; 
				var weak = new Contract(outLink.text).addToGroup(this.group);
				outLink.changeFrom(weak.key, "n");
				
				this.delete();
				token.rewrite = true;
				token.forward = true;

				return nextLink;
			}

			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			return new Root();
		}
	}

	return Root;
});