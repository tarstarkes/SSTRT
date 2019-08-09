function load_bar_width(val){
	$($('#load_bar div')[0]).animate({
	    width: val
	}, 500, function(){
	    // Animation complete.
	});
	document.getElementById('percent').innerHTML = val;
}
function add_final_call(p){
	var width = ( 100 * parseFloat($($('#load_bar div')[0]).css('width')) / parseFloat($($('#load_bar div')[0]).parent().css('width')) );
	width = parseInt(width);
	var total = width+p;
	if(total > 100){
		total = 100;
	}
	width = total+"%"
	$($('#load_bar div')[0]).css('width', width);
	document.getElementById('percent').innerHTML = width;
}

function check_leg(){
	current_legs = parseInt(window.localStorage.getItem('current_legs_reported'));
	all_legs = parseInt(window.localStorage.getItem('legs_to_export'));
	if(current_legs == all_legs){
		load_bar_width('100%');
		alert("Data successfully exported!");
		window.setTimeout(function(){
			document.getElementById('percent').innerHTML = '0%';
			$($('#load_bar div')[0]).css('width', 0);
			$('#load_bar').hide();
		}, 1000);
	}
}

function increment_leg(){
	current_legs = window.localStorage.getItem('current_legs_reported');
	current_legs = parseInt(current_legs)+1;
	window.localStorage.setItem('current_legs_reported', current_legs);
	check_leg();
}

//LEG EXPORT FUNCTIONS---------------------------------------------

function export_leg(t, team_object, leg_number, leg_object=false){
	var Team = Parse.Object.extend("team");
	var team = new Team();
	team.id = team_object['id'];

	if(leg_object == false){
		var Leg = Parse.Object.extend("leg");
		var leg = new Leg();
	}
	else{
		var Leg = Parse.Object.extend("leg");
		var leg = new Leg();
		leg.id = leg_object['id'];
	}

	leg.set('station_number', leg_number);
	leg.set('leg_time', t.leg_time[parseInt(leg_number)]);
	leg.set('team_id', team);
	leg.save(null, {
		success: function(results){
			console.log('Leg data exported leg: '+t.leg_time[parseInt(leg_number)]+", team: "+t.team_name);
		},
		error: function(results, error){
			console.log('failed to export team data: '+error.message);
		}
	});
}
function leg_export_call(t, team_object, leg_number, percentage){
	var Team = Parse.Object.extend("team");
	var team = new Team();
	team.id = team_object['id'];

	var Leg = Parse.Object.extend('leg');
	var leg = new Leg();

	leg_query = new Parse.Query(Leg);
	leg_query.equalTo('station_number', parseInt(leg_number));
	leg_query.equalTo('team_id', team);
	
	leg_query.find({
		success: function(results){
			var object;
			if(results.length > 0){
				for (var i = 0; i < results.length; i++) {
					object = results[i];
					if(object.attributes.leg_time != t.leg_time[parseInt(leg_number)]){
						yes_no = confirm(t.team_name+" already has a time time recorded for leg "+leg_number+", do you wish to overwrite this team's data?");
						if(yes_no == true){
							export_leg(t, team_object, leg_number, object);
						}
					}
				}
				add_final_call(percentage);
			}
			else{
				export_leg(t, team_object, leg_number);
				add_final_call(percentage);
			}
			increment_leg();
		},
		error: function(error){
			console.log('failed to export leg data: '+error.message);
			add_final_call(percentage);
		}
	});
}
function run_secondary_loop(t, team_object, i){
	var all_teams = JSON.parse(window.localStorage.getItem('teams'));
	var percentage = parseInt(25/i);
	for(var x=0; x < t.leg_time.length; x++){
		if(t.leg_time[x] != null && t.leg_time[x] != undefined){
			leg_export_call(t, team_object, x, percentage);
		}
	}
	load_bar_width('75%');
}
function legs_export(t, team_object){
	var i=0;
	if(t.leg_time.length > 0){
		for(var j=0; j < t.leg_time.length; j++){
			if(t.leg_time[j] != null && t.leg_time[j] != undefined){
				i=i+1;
				all_legs = window.localStorage.getItem('legs_to_export');
				all_legs = parseInt(all_legs)+1;
				window.localStorage.setItem('legs_to_export', all_legs);
			}
			if(j == (t.leg_time.length-1)){
				run_secondary_loop(t, team_object, i);
			}
		}
	}
	else{
		check_leg();
	}
}
//END LEG EXPORT ---------------------------------------------


//TEAM EXPORT FUNCTIONS ---------------------------------------------
function export_team(t, team, race_object){
	var Race = Parse.Object.extend("race");
	var race = new Race();
	race.id = race_object['id'];

	team.set('team_name', t.team_name);
	team.set('bib', t.bib_number);
	team.set('race_id', race);
	team.set('team_start_time', t.team_start_time);
	team.save(null, {
		success: function(results){
			console.log('TEAM data exported');
		},
		error: function(results, error){
			console.log('failed to export team data: '+error.message);
		}
	});
}

function team_export_call(race_object, i){
	var Race = Parse.Object.extend("race");
	var race = new Race();
	race.id = race_object['id'];

	var Teams = Parse.Object.extend("team");
	var team = new Teams();
	var t = JSON.parse(window.localStorage.getItem('teams'));

	teams_query = new Parse.Query(Teams);
	teams_query.equalTo('team_name', t[i].team_name);
	teams_query.equalTo('race_id', race);
	teams_query.find({
	success: function(results){
		var object;
		if(results.length > 0){
			for (var j = 0; j < results.length; j++) {
				object = results[j];
		    }
		}else{
			export_team(t[i], team, race_object);
		}
		legs_export(t[i], object);
	},
	error: function(error){
		console.log('failed to export data: '+error.message);
	}});
}

function teams_export(race_object){
	alert('teams');
	load_bar_width('50%');
	var t = JSON.parse(window.localStorage.getItem('teams'));
	if(t != null){
		for(var i=0; i < t.length; i++){
			team_export_call(race_object, i);
		}
		if(t.length == 0){
			check_leg();
		}
	}
	else{
		check_leg();
	}

}
//END TEAM EXPORT ---------------------------------------------
//RACE EXPORT FUNCTIONS ---------------------------------------------
function export_race(r, race){
	race.set('race_key', r.race_key);
	race.set('race_start_time', r.race_time);
	race.save(null, {
		success: function(results){
			console.log("Export Operation Complete!");
			load_bar_width('25%');
		},
		error: function(results, error){
			console.log('Failed to export data: '+error.message);
		}
	});
}
//END RACE EXPORT ---------------------------------------------