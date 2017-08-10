class GC {

	constructor(graph) {
		this.graph = graph;
		this.noMore = false;
	}
	
	collect() {
		do {
			this.collectInGroup(this.graph.child);
		} while (!this.noMore)
	}

	collectInGroup(group) {
		this.noMore = true;
		for (let node of Array.from(group.nodes)) {
			if ((node instanceof Weak) || (node instanceof Contract && node.findLinksInto(null).length == 0)) {
				var nextNode = this.graph.findNodeByKey(node.findLinksOutOf(null)[0].to);
				if (!(nextNode instanceof Abs)) {
					this.collectFromBottom(node);
					this.noMore = false;
				}
			}
			else if (node instanceof Group) {
				this.collectInGroup(node);
			}
		}
	}

	collectFromBottom(node) {
		if ((node instanceof Contract && node.findLinksInto(null).length != 0) || node instanceof Pax) {

		}
		else if (node instanceof Promo || node instanceof Recur) {
			for (let aux of node.group.auxs) {
				this.collectFromBottom(aux);
			}
			node.group.delete();
		}
		else {
			for (let link of node.findLinksOutOf(null)) {
				this.collectFromBottom(this.graph.findNodeByKey(link.to));
			}
			node.delete();
		}
	}
}