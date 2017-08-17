var fact_prog = 
  'let fact = rec(f,x).\n'
+ '  if (x <= 1)\n'
+ '  then 1\n'
+ '  else (x * (f (x - 1)))\n'
+ 'in\n'
+ '\n'
+ 'fact 4';

var prov_prog = 
  'let x = {1} in\n'
+ 'let y = x + 2 in\n'
+ '(set x to 3);\n'
+ 'y'

var complex_change_prog =
  'let x = {1} in\n'
+ 'let y = {2} in\n'
+ 'let f = {λz. x + ((set x to y); z) + y} in\n'
+ '(f 3) + (f 4)'