define(function() {


	var CompData = {
		EMPTY: '-',
		PROMPT: '*',
		LAMBDA: 'λ',
		R: '@',
		UNIT: '•',
		IF0: 'if0',
		IF1: 'if1',
	}

	var RewriteFlag = {
		EMPTY: '□',
		F_LAMBDA: '<λ>',
		F_OP: '<$>',
		F_IF: '<if>',
		F_C: '<C>',
		F_PROMO: '<!>',
		F_RECUR: '<μ>',
		F_MOD: '<M>',
		F_DEP: '<p>',
		F_DELTA: '<Δ>',
		F_PROP: '<s>',
	}

	class MachineToken {

		static CompData() { return CompData; }

		static RewriteFlag() { return RewriteFlag; }

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

