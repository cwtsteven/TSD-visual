define(function() {


	var CompData = {
		EMPTY: '-',
		PROMPT: '*',
		LAMBDA: 'λ',
		UNIT: '()',
		IF0: 'if0',
		IF1: 'if1',
		DEP : 'g',
		BIGLAMBDA: 'Λ',
		
		PL: 'L',
		PR: 'R',
		PE: 'P',
		//PROJ: 'π',
	}

	var RewriteFlag = {
		EMPTY: '□',
		F_LAMBDA: '<λ>',
		F_OP: '<$>',
		F_IF: '<if>',
		F_C: '<C>',
		F_PROMO: '<!>',
		F_RECUR: '<μ>',
		F_CREATE: '<m>',
		F_PEEK: '<p>',
		F_ROOT: '<r>',
		F_LINK: '<l>',
		F_ASSIGN: '<a>',
		F_FUSE: '<F>',
		F_FOLD: '<f>',
		F_STEP: '<s>',
		F_SP: '<sp>',
		F_BIGLAMBDA: '<Λ>',

		F_PAIR: '<,>',
	}

	class Pair {
		constructor(a,b) {
			this.a = a;
			this.b = b;
		}

		toString() {
			return "(" + this.a + "," + this.b + ")";
		}
	}

	class MachineToken {

		static CompData() { return CompData; }

		static RewriteFlag() { return RewriteFlag; }

		static Pair() { return Pair; }

		constructor(machine) {
			this.machine = machine;
			this.reset();
		}

		setLink(link) {
			if (this.link != null) {
				//this.link.tokens.splice(this.link.tokens.indexOf(this), 1);
				this.link.clearFocus();
			}
			this.link = link;
			if (this.link != null) {
				//this.link.tokens.push(this);
				if (this.isMain)
					this.link.focus("red");
				else
					this.link.focus("green");
			}
		}

		reset() {
			this.forward = true;
			this.rewrite = false;
			this.transited = false;
			
			this.link = null;
			
			this.rewriteFlag = RewriteFlag.EMPTY;
			this.payload = null;
			this.dataStack = [CompData.PROMPT];
			this.boxStack = [];
		}

		delete() {
			this.setLink(null);
			this.machine.evalTokens.splice(this.machine.evalTokens.indexOf(this),1);
		}
	}

	return MachineToken;
});

