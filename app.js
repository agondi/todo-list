const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const https = require('https');
const _ = require('lodash');

const app = express();
var foundItems = []; 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));
// app.use(express.static("public"));

mongoose.connect("mongodb+srv://adminAG:08102006@cluster0.oerpy.mongodb.net/todolistDB", {useNewUrlParser:true});

const itemsSchema = {
	name:String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
	name: "Welcome to your to-do list!"
});

const item2 = new Item({
	name: "Hit the + button to add a new item"
});

const item3 = new Item({
	name: "<--  Hit this to delete me"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name:String, 
	items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get('/', function(req, res){
	Item.find({}, function(err, foundItems){
		if(foundItems.length === 0){
			Item.insertMany(defaultItems, function(err){
				if(err){
					console.log(err);
				}
				else{
					console.log("Success");
				}
			});
			console.log("hi");
			res.redirect("/");
		}
		else{
			res.render("list", {listTitle: "Today", newListItems: foundItems});
		}
	});
	
}); 

app.get("/:customListName", function(req, res){
	console.log(req.params.customListName);
	const customListName = _.capitalize(req.params.customListName);
	List.findOne({name: customListName}, function(err, foundList){
		if (!err){
			if(!foundList){
				const list = new List({
					name: customListName, 
					items: defaultItems
				});

				list.save();
				res.redirect("/" + customListName);
			}
			else{
				res.render("list", {listTitle: customListName, newListItems: foundList.items});
			}

		}
		else{
			console.log(err);
		}
	});
	
});

app.post("/", function(req, res){
	const itemName = req.body.newItem; 
	const listName = req.body.submit;

	const item = new Item({
		name: itemName
	});
	

	if (listName == "Today"){
		item.save();
		res.redirect("/");
	}
	else{
		List.findOne({name: listName}, function(err, foundList){
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}

	
});

app.post("/delete", function(req, res){
	const checkedId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName == "Today"){
		Item.findByIdAndRemove(checkedId, function(err){
			if(!err){
				console.log("Successfully deleted from list");
				res.redirect("/");
			}
		});
	}
	else {
		List.findOneAndUpdate(
			{name: listName}, 
			{$pull: 
				{items: 
					{_id: checkedId}
				}
			},
			function(err, foundList){
				if(!err){
					res.redirect("/" + listName);
				}					
			});
	}
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

app.listen(port, function(){
	console.log("Server Started Successfully");
});