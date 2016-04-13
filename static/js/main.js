function graph(container){

	this.nodes = new vis.DataSet();
	this.edges = new vis.DataSet();
	this.container = container;
	this.network;

	var self = this;

	this.nodes.on("*", function(){
		self.fill_drop_downs();
	});

	this.fill_drop_downs =function(){
		$(".father-dropdown, .mother-dropdown, #child-relationship-dropdown").empty().append("<option></option>");
		var male_select = $(".father-dropdown");
		var female_select = $(".mother-dropdown")
		var child_select = $("#child-relationship-dropdown");
		
		self.nodes.forEach(function(node){
			var option_string = "<option value='" + node.id + "''>" + node.properties.name + " " + node.properties.surname + "</option>";
			female_select.append(option_string);
			child_select.append(option_string);
		},
		{
			filter: function(node){
				return node.properties.gender === "female";
			}
		});

		self.nodes.forEach(function(node){
			var option_string = "<option value='" + node.id + "''>" + node.properties.name + " " + node.properties.surname + "</option>";
			male_select.append(option_string);
			child_select.append(option_string);
		},
		{
			filter: function(node){
				return node.properties.gender === "male";
			}
		});
	}

	this.init = function(){
		self.network = new vis.Network(
			self.container,
			{
				nodes: self.nodes,
				edges: self.edges
			},
			CONF.GRAPH_OPTIONS);
		self.fill_drop_downs();

	};

	this.add_nodes = function(nodes){
		$.map(nodes,function(val,i){
			val.label=val.properties.name + "\n" + val.properties.surname;
			val.color=val.properties.gender === "female"?CONF.COLORING_FEMALE:CONF.COLORING_MALE;
		});
		self.nodes.update(nodes);
	};

	this.add_relation = function(relation){
		self.edges.add(
			{from: relation.endNode,
				to: relation.startNode}
				);
	};

	this.on_select_node = function(callback){
		if (!self.network){
			self.init();
		}
		self.network.on("selectNode",callback);

	};

	this.on_deselect_node = function(callback){
		if (!self.network){
			self.init();
		}
		self.network.on("deselectNode",callback);

	};

	this.fill_form_with_node = function(nodeId){

		var node = self.nodes.get(nodeId);
		var person = node.properties;
		$("#person-header-name").text(person.name + " " + person.surname);
		$("#id").val(nodeId);
		$("#name").val(person.name);
		$("#surname").val(person.surname);
		$("#maidenname").val(person.maidenname);
		if (person.gender==="male"){
			$("#gender").bootstrapToggle('enable').bootstrapToggle('on');
		}
		else {
			$("#gender").bootstrapToggle('enable').bootstrapToggle('off');
		}
		$("#birthday").val(person.birthday);
		$("#placeofbirth").val(person.placeofbirth);
		$("#landofbirth").val(person.landofbirth);

	};


	this.populate_from_db = function(data){
		$.each(data.results, function(k,v){
			$.each(v.data, function(k,v){
				self.add_nodes(v.graph.nodes);
				self.add_relation(v.graph.relationships[0]);
			});
		});
	};
};

var show_person_header = function(content){
	$("#person-header").show().find("#person-header-name").text(content);
}

var dict_to_object_list = function(dict, selected){
	var html_options = "";
	$.each(dict,function(k,v){
		html_options+= "<option value='" + k + "'";
		if (selected && selected === k){
			html_options+= "selected='selected'";
		}
		html_options+= ">"+ v + "</option>";
	});
	return html_options;
};


var get_country_options = (function(){

	var codes;

	return function(callback){

		if (codes){
			callback(codes);
			return;	
		} 

		$.getJSON( "https://cdn.rawgit.com/umpirsky/country-list/master/data/de_DE/country.json", function( data ) {
			callback(dict_to_object_list(data,"DE"));
		});
	};
})();

function graph_db(){

	this.update_person = function(id, person, success, error){

		//the following is not so nice

		var stringified = JSON.stringify(person);
		stringified.replace(/\\"/g,"\uFFFF");
		stringified = stringified.replace(/\"([^"]+)\":/g,"$1:").replace(/\uFFFF/g,"\\\"");

		var data = {
			"statements": [
			]
		};
		if (id === ""){
			// Create new entry
			data.statements.push({
				"statement" : "MERGE (n:Person " + stringified + ") RETURN n",
				"resultDataContents" : ["graph"]
			});

		} else {
			// update
			data.statements.push({
				"statement" : "MATCH n WHERE id(n) = " + id + " SET n = {props} RETURN n",
				"resultDataContents" : ["graph"],
				"parameters" : {
					"props" : person,
				}
			});
		}

		$.ajax({
			type: "POST",
			url: CONF.NEO4J_URL + "transaction/commit",
			contentType: 'application/json',
			headers: {
				"Authorization": "Basic " + localStorage.credentials
			},
			data: JSON.stringify(data),
			success: success,
			error: error
		});
	}

	this.add_parent_relation = function(from_id, to_id, success, error){
		$.ajax({
			type: "POST",
			url: CONF.NEO4J_URL + "transaction/commit",
			contentType: 'application/json',
			headers: {
				"Authorization": "Basic " + localStorage.credentials
			},
			data: JSON.stringify({
				"statements": [
				{
					"statement": "MATCH (a:Person),(b:Person) WHERE id(a) = " + from_id + " AND id(b) = " + to_id + " MERGE (a)-[r:IS_CHILD_OF]->(b) RETURN a,r,b",
					"resultDataContents" : ["graph"]
				}
				]
			}),
			success: success,
			error: error
		});
	}

	this.get_graph = function(success, error){
		$.ajax({
			type: "POST",
			url: CONF.NEO4J_URL + "transaction/commit",
			contentType: 'application/json',
			headers: {
				"Authorization": "Basic " + localStorage.credentials
			},
			data: JSON.stringify({
				"statements": [
				{
					"statement": "MATCH (n-[r]->m) return n,r,m",
					"resultDataContents" : ["graph"]

				}
				]
			}),
			success: success,
			error: error
		});	
	}


}





var show_side_panel = function(){
	if ($("#side-panel").hasClass("hidden")){
		$("#main-panel").toggleClass("col-lg-12 col-lg-8 right-bordered");
		$("#side-panel").toggleClass("hidden col-lg-4");
		$("#add-button").html("<i class='fa fa-chevron-right'></i>");

	}
};

var hide_side_panel = function(){
	if (!$("#side-panel").hasClass("hidden")){
		$("#main-panel").toggleClass("col-lg-12 col-lg-8 right-bordered");
		$("#side-panel").toggleClass("hidden col-lg-4");
		$("#add-button").html("<i class='fa fa-plus'></i>");
	}
};


$(document).ready(function(){

	$("#login-button").click(function(){
		$.ajax({
			type: "GET",
			url: CONF.NEO4J_URL,
			contentType: 'application/json',
			headers: {
				"Authorization": "Basic " + btoa($("#user-input").val() + ":" + $("#password-input").val())
			},
			success: function(data){
				$("#login-modal").modal("hide");
				localStorage.credentials = btoa($("#user-input").val() + ":" + $("#password-input").val()); 
				on_login_success();
			},
			error: function(jqXHR, textStatus, errorThrown){
				$("#login-error-display").append("<div class='alert alert-danger' role='alert'> Login nicht möglich..</div>");
			}
		});	
	});

	if (!localStorage.credentials){
		$("#login-modal").modal();	
	} else {
		on_login_success();
	}
	
});




var on_login_success = function(){
	get_country_options(function(countries){
		$("#landofbirth").append(countries);
	});

	var db = new graph_db(CONF.NEO4J_URL, CONF.USER, CONF.PASSWORD);
	var g = new graph($('#tree-display')[0]);
	g.init();

	db.get_graph(g.populate_from_db, function(data){
		localStorage.removeItem("credentials");
		alert("Fehler beim Zugriff auf Server.");
	});

	g.on_select_node(function(select_node_event){
		g.fill_form_with_node(select_node_event.nodes[0]);
		$(".person-header-button").show();
		$("#commit-button").text("Aktualisieren");
		$("#person-form :input").prop("disabled", true);
		$("#commit-button").hide();
		show_side_panel();
	});

	g.on_deselect_node(function(select_node_event){
		$("#person-form :input").val("");
		$("#commit-button").text("Hinzufügen");
		hide_side_panel();
	});

	$("#edit-person-button").click(function(event){
		$("#person-form :input").prop("disabled",false);
		$("#commit-button").show();
	});


	$("#add-person-button").click(function(event){
		$("#person-form :input").val("").prop("disabled",false);
		$("#person-header-name").text("Neue Person anlegen");
		$("#commit-button").text("Hinzufügen");
		$(".person-header-button").hide();	
		$("#commit-button").show();
	});

	$("#commit-button").click(function(event){
		event.preventDefault();

		var person = {};
		person.name = $("#name").val();
		person.surname = $("#surname").val();
		person.maidenname = $("#maidenname").val();
		person.gender = $("#gender").prop("checked")?"male":"female";
		person.birthday = $("#birthday").val();
		person.placeofbirth = $("#placeofbirth").val();
		person.landofbirth = $("#landofbirth").val();
		if (person.name=== "" && person.surname === "" ){
			$("#entry-error-display").append("<div class='alert alert-danger' role='alert'> Bitte gib mindestens Vor- oder Nachnamen an.</div>");
		} else {
			$("#entry-error-display").empty();
			db.update_person($("#id").val(),person, function(data){
				if (data.errors.length === 0){
					$("#side-panel input").val("");
					g.add_nodes(data.results[0].data[0].graph.nodes);
				} else {
					console.error(data.errors);	
				}
			},function(data){
			});
		}
		
		return false;
	});


	$("#add-button").click( function(){
		if ($("#side-panel").hasClass("hidden")){
			show_side_panel();
			$("#side-panel :input").val("").prop("disabled", false);
			$("#person-header-name").text("Neue Person anlegen");
			$("#commit-button").text("Hinzufügen");
			$(".person-header-button").hide();	
			$("#commit-button").show();

		} else {
			hide_side_panel();
		}
	});


	$("#add-relationship-button").click(function(){
		var child_id = $("#child-relationship-dropdown").val();
		var father_id = $("#father-relationship-dropdown").val();
		var mother_id = $("#mother-relationship-dropdown").val();
		if (child_id === "") {
			$("#relationship-error-display").append("<div class='alert alert-danger' role='alert'>Kein Kind ausgewählt!</div>");
			return;
		}
		$("#relationship-error-display").empty();
		if (father_id !== ""){
			db.add_parent_relation(child_id, father_id,function(data){
				g.add_relation(data.results[0].data[0].graph.relationships[0]);
			},function(data){
			});
		}
		if (mother_id !== ""){
			db.add_parent_relation(child_id, mother_id,function(data){
				g.add_relation(data.results[0].data[0].graph.relationships[0]);
			},function(data){
			}	);
		}
	});

};


