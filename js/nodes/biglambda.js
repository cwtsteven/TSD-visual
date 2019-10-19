define(function(require) {
	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var NameInstance = require('nodes/name-instance');
	var Pair = require('token').Pair();

	class BigLambda extends Node {

		constructor(pname) {
			super(null, "", "yellow");
			this.updatePName(pname); 
		}
		
		transition(token, link) {
			if (link.to == this.key && link.toPort == "s") {
				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				var data = token.dataStack.last();
				if (data == CompData.PROMPT && !(prev instanceof NameInstance)) {
					token.dataStack.pop();
					token.dataStack.push(new Pair(CompData.BIGLAMBDA,CompData.EMPTY));
					token.forward = false;
					return link;
				}
				else if (data == CompData.PROMPT && prev instanceof NameInstance) {
					var nextLink = this.findLinksOutOf(null)[0];
					//token.dataStack.pop();
					token.rewriteFlag = RewriteFlag.F_BIGLAMBDA; 
					return nextLink; 
				}
			}
		}

		rewrite(token, nextLink) { 
			if (token.rewriteFlag == RewriteFlag.F_BIGLAMBDA && nextLink.from == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				var prev = this.graph.findNodeByKey(this.findLinksInto("s")[0].from);
				if (prev instanceof NameInstance) {
					var oldGroup = this.group;
					this.group.updateNames(this.pname, prev.pname); 
					oldGroup.moveOut(); // this.group is a box-wrapper
					oldGroup.box.delete();
					for (let aux of Array.from(oldGroup.auxs)) {
						oldGroup.removeAux(aux); // preserve outLink
					}
					var inLink = oldGroup.prin.findLinksInto(null)[0];
					var outLink = oldGroup.prin.findLinksOutOf(null)[0];
					if (outLink != null && inLink != null) {
						inLink.changeTo(outLink.to, outLink.toPort);
					}
					oldGroup.prin.delete();
					//oldGroup.delete(); 
					var newNextLink = prev.findLinksInto(null)[0]; 
					//prev.deleteAndPreserveInLink(); // preserve inLink
					var inLink = prev.findLinksInto(null)[0]; 
					var outLink = prev.findLinksOutOf(null)[0]; 
					if (outLink != null && inLink != null) { 
						inLink.changeTo(outLink.to, outLink.toPort);
					}
					prev.delete();
					
					token.rewrite = true;
					return newNextLink; 
				}
					
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		updatePName(pname) {
			this.pname = pname;
			this.text = "Λ"+pname+"";
		}

		copy() {
			return new BigLambda(this.pname);
		}
	}

	return BigLambda;
});