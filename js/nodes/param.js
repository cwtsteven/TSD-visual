define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var Pair = require('token').Pair();

	class Param extends Node {

		constructor(pname) {
			super(null, "P("+pname+")", "mediumpurple1");
			this.pname = pname;
		}
		
		transition(token, link) {
			if (link.to == this.key && token.dataStack.last() == CompData.PROMPT) {
				var nextLink = this.findLinksOutOf(null).last();
				token.dataStack.push(CompData.PROMPT);
				return nextLink;
			}
			else if (link.from == this.key) {
				var index = this.findLinksOutOf(null).indexOf(link);
				if (index != 0) {
					var nextLink = this.findLinksOutOf(null)[index-1];
					token.dataStack.push(CompData.PROMPT);
					token.forward = true;
					return nextLink;
				}
				else {
					var data = [];
					var i;
					for (i=0;i<this.findLinksOutOf(null).length;i++) {
						data[i] = token.dataStack.pop().a;
						
					}
					token.dataStack.pop();
					token.dataStack.push(new Pair(data,this.key));
					return this.findLinksInto(null)[0] 
				}
			}
		}

		copy() {
			// should never happen
		}
	}

	return Param;
});