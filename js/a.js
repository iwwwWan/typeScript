var Color;
(function (Color) {
    Color[Color["Red"] = 0] = "Red";
    Color[Color["Green"] = 1] = "Green";
    Color[Color["Blue"] = 2] = "Blue";
})(Color || (Color = {}));
(function (Color) {
    Color[Color["Red1"] = 15] = "Red1";
    Color[Color["Green1"] = 16] = "Green1";
    Color[Color["Blue1"] = 17] = "Blue1";
})(Color || (Color = {}));
var c = Color['15'];
console.log(c);
console.log(Color);
var Color1;
(function (Color1) {
    Color1[Color1["Red"] = 0] = "Red";
    Color1[Color1["Orange"] = 2] = "Orange";
    Color1[Color1["Yellow"] = 3] = "Yellow";
    Color1[Color1["Green"] = 4] = "Green";
    Color1[Color1["Blue"] = 5] = "Blue";
    Color1[Color1["Indigo"] = 5] = "Indigo";
    Color1[Color1["Purple"] = 6] = "Purple";
})(Color1 || (Color1 = {}));
console.log(Color1);
console.log(Color1.Blue == Color1.Indigo);
console.log(Color1.Indigo);
console.log(Color1.Blue !== Color1.Indigo ? 'yes' : 'no'); // 'no'
