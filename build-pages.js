
// prepare the HBS template
var Handlebars = require('handlebars');
var fs = require("fs");
var template = (fs.readFileSync("./pages/template.hbs") + "");
var hbsTemplate = Handlebars.compile(template);


// compuile the markdown
var marked = require('marked');
marked.setOptions({gfm: true});

fs.readdirSync("./pages").forEach(file => {
    if(file === "template.hbs") return ;
    if(!fs.existsSync("./dist/pages")) {
        fs.mkdirSync("./dist/pages");
    }
    var html = marked(fs.readFileSync("./pages/" + file) + "");
    fs.writeFileSync("./dist/pages/" + file.replace(".md", ".html"), (hbsTemplate({content: html})));
});