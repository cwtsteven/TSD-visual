var dpi = 96;

Array.prototype.last = function() {
    return this[this.length-1];
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var play = false;
var playing = false;
var finished = false;

var isDraw = true;

require(["jquery", "renderer", "goi-machine"],
	function ($, renderer, machine) {

		function clearGraph(callback) {
			renderer.render('digraph G {\n\t\n}');
			$("#ta-graph").val("");
			pause();
			setTimeout(callback, 100);
		}

		function draw() {
			var width = $("#graph").width();
			var height = $("#graph").height();
			// update stage with new dot source
			var result = machine.graph.draw(width/dpi, height/dpi);
			$("#ta-graph").val(result);
			if (isDraw)
				renderer.render(result);
		}

		// register onClick event
		$("#btn-make-graph").click(function(event) {
			clearGraph(function() {
				$("#dataStack").val("");
				$("#flag").val("");
				$("#boxStack").val("");
				$("#modStack").val("");
				var source = $("#ta-program").val();
				machine.compile(source);
				draw();
				finished = false;
			});
		});

		$("#btn-save").click(function (event) {
		      var img = renderer.stage.getImage(false);
		      img.onload = function () {
		        $("#download").attr("href", img.src);
		        $("#download")[0].click();
		      };
		      event.preventDefault();
		});

		$("#btn-info").click(function (event) {
		      alert(info);
		});

		$('#cb-show-key').change(function() {
	        showKey = this.checked;
	        $("#btn-refresh").click();       
   		 });

		$('#cb-draw').change(function() {
	        isDraw = this.checked;
	        $("#btn-refresh").click();       
   		 });

		$("#btn-refresh").click(function(event) {
			clearGraph(function() {
				draw();
			});
		});

		$("#btn-play").click(function(event) {
			play = true;
			if (!playing)
				autoPlay();
		});

		function autoPlay() {
			playing = true;
			next();
			if (play)
				if (isDraw)
					setTimeout(autoPlay, 800);
				else
					setTimeout(autoPlay, 0);
			else
				playing = false;
		}

		function pause() {
			play = false;
			playing = false;
		}

		function next() {
			if (!finished) {
				machine.pass($("#flag"), $("#dataStack"), $("#boxStack")); //, $("#modStack"));
				draw();
			}
		}

		$("#btn-pause").click(function(event) {
			pause();
		});

		$("#btn-next").click(function(event) {
			pause();
			next();
		});

		$("#ta-program").on('input', function() {
		    specialChar(this);
		}).trigger('input');

		var $stacks = $('#flag, #dataStack, #boxStack'); //, #modStack');
		var sync = function(e){
		    var $other = $stacks.not(this);
		    $other.get(0).scrollTop = this.scrollTop;
		    $other.get(1).scrollTop = this.scrollTop;
		    //$other.get(2).scrollTop = this.scrollTop;
		}
		$stacks.on('scroll', sync);

		renderer.init("#graph");
		//renderer.init({element: "#graph", zoom: {extent: [0.1, 10]}})

  		$("#btn-make-graph").click();
	}
);

function specialChar(textarea) {
	text = textarea.value;
	if (text.includes("\\lambda")) {
		var selection = textarea.selectionStart;
		textarea.value = text.replace("\\lambda", "λ");
		textarea.setSelectionRange(selection-6, selection-6);
	}
}

var info = 
  '<var> ::= {variables}\n'
+ '<bool> ::= true | false\n'
+ '<num> ::= {num}\n'
+ '<const> ::= <bool> | <num>\n'
+ '<expr> ::= <var>\n'
+ '         | λ <var>. <expr>\n'
+ '         | <expr> <expr>\n'
+ '         | <const>\n'
+ '         | ~ <expr> \n'
+ '         | <expr> + <expr> | <expr> - <expr> | <expr> * <expr> | <expr> / <expr> | <expr> <= <expr>\n'
+ '         | <expr> && <expr> | <expr> || <expr> \n'
+ '         | rec <var>. <expr>\n'
+ '         | let <var> = <expr> in <expr>\n'
+ '         | { <expr> }\n'
+ '         | link <var> to <expr>\n'
+ '         | set <var> to <expr>\n'
+ '         | peek <expr>\n'
+ '         | deref <expr>\n'
+ '         | step\n'
+ '\n'
+ '\n'
+ 'Speical characters: λ=\'\\lambda\''
