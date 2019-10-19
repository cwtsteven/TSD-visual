define(function(require) {

	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Expo = require('nodes/expo');

	class Contract extends Expo {

		constructor(name) {
			super(null, "C", name);
		}

		transition(token, link) {
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf(null)[0];
				token.boxStack.push(link);
				token.rewriteFlag = RewriteFlag.F_C;
				return nextLink;
			}
			else if (link.from == this.key && token.boxStack.length > 0) {
				var nextLink = token.boxStack.pop();
				return nextLink;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_C && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				/*
				if (this.findLinksInto(null).length == 1) {
					token.boxStack.pop();
					var inLink = this.findLinksInto(null)[0];
					nextLink.changeFrom(inLink.from, inLink.fromPort);
					this.delete();
				}
				else {
				*/
				var i = token.boxStack.last();
				var prev = this.graph.findNodeByKey(i.from);
				if (prev instanceof Contract) {
					token.boxStack.pop();
					/*
					for (let _token of Array.from(nextLink.tokens)) {
						if (_token.boxStack.last() == i)
							_token.boxStack.pop();
					}
					for (let _token of Array.from(i.tokens)) {
						_token.setLink(nextLink);
						_token.rewriteFlag = RewriteFlag.F_C;
					}
					*/
					for (let link of prev.findLinksInto(null)) {
						link.changeTo(this.key, "s");
					}
					prev.delete();
					token.rewriteFlag = RewriteFlag.F_C;
				}
				//}
				
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		copy() {
			var con = new Contract(this.name);
			con.text = this.text;
			return con;
		}
	}

	return Contract;
});