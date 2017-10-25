class Contract extends Expo {

	constructor(name) {
		super(null, "C", name);
	}

	transition(token, link) {
		if (link.to == this.key) {
			token.boxStack.push(link);
			token.rewriteFlag = RewriteFlag.F_C;
			return this.findLinksOutOf(null)[0];
		}
		else if (link.from == this.key && token.boxStack.length > 0) {
			return token.boxStack.pop();
		}
	}

	rewrite(token, nextLink) {
		if (token.rewriteFlag == RewriteFlag.F_C && nextLink.from == this.key) {
			token.rewriteFlag = RewriteFlag.EMPTY;

			if (this.findLinksInto(null).length == 1) {
				for (let _token of nextLink.tokens)
					_token.boxStack.pop();
				var inLink = this.findLinksInto(null)[0];
				for (let _token of inLink.tokens)
					_token.setLink(nextLink);
				nextLink.changeFrom(inLink.from, inLink.fromPort);
				this.delete();
			}
			else {
				var i = token.boxStack.last();
				var prev = this.graph.findNodeByKey(i.from);
				if (prev instanceof Contract) {
					for (let _token of Array.from(nextLink.tokens)) {
						if (_token.boxStack.last() == i)
							_token.boxStack.pop();
					}
					for (let _token of Array.from(i.tokens)) {
						_token.setLink(nextLink);
						_token.rewriteFlag = RewriteFlag.F_C;
					}
					for (let link of prev.findLinksInto(null)) {
						link.changeTo(this.key, "s");
					}
					prev.delete();
					token.rewriteFlag = RewriteFlag.F_C;
				}
			}
			
			token.rewrite = true;
			return nextLink;
		}
		
		else if (token.rewriteFlag == RewriteFlag.EMPTY) {
			token.rewrite = false;
			return nextLink;
		}
	}

	analyse(token) {
		for (let link of this.findLinksInto(null)) {
			var newToken = new AnalysisToken(token.machine, link);
			newToken.mNodes = Array.from(token.mNodes);
			token.machine.aTokens.push(newToken);
		}
		token.machine.aTokens.splice(token.machine.aTokens.indexOf(token), 1);
		return null;
	}

	propagate(token) {
		for (let link of this.findLinksInto(null)) {
			var newToken = new PropToken(token.machine, link);
			token.machine.propTokens.push(newToken);
			newToken.mNodes = Array.from(token.mNodes);
		}
		token.machine.propTokens.splice(token.machine.propTokens.indexOf(token), 1);
		return null;
	}

	copy() {
		var con = new Contract(this.name);
		con.text = this.text;
		return con;
	}
}