// general graph
class Graph {
	
	constructor() {
		this.clear();
	}

	clear() {
		this.key = 0;
		this.linkKey = 0;
		this.allNodes = new Map(); // for efficiency searching
		this.allLinks = new Map(); // for printing ONLY
		this.child = new Group(); 
	}

	// give a key to a node and add it to allNodes
	addNode(node) {
		node.key = 'nd' + this.key;
		this.allNodes.set(node.key, node);
		this.key++;
	}

	// also removes connected links
	removeNode(node) {
		for (let link of Array.from(node.findLinksConnected())) {
			link.delete();
		}
		return this.allNodes.delete(node.key);
	}

	findNodeByKey(key) {
		return this.allNodes.get(key);
	}

	addLink(link) {
		link.key = this.linkKey;
		this.allLinks.set(link.key, link);
		this.linkKey++;
	}

	removeLink(link) {
		this.allLinks.delete(link.key);
	}

	draw(width, height) {
		var str = this.child.draw('\n  ');
		str += '\n';
		for (let link of this.allLinks.values()) {
			str += link.draw('\n  ');
		}
		return 'digraph G {'
		   	+'\n  rankdir=BT;'
		   	+'\n  edge[arrowhead=none,arrowtail=none];'
		   	+'\n  node[fixedsize=true,shape=circle]'
		   	+'\n  size="' + width + ',' + height + '";'
		   	+'\n  labeldistance=0;'
		   	+'\n  nodesep=.175;'
  			+'\n  ranksep=.175;'
			+'\n' 
			+     str 
		   	+'\n}';
	}
}
