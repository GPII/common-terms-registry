function(keys, values, rereduce) { 
    var data = {}; 
    if (rereduce) { 
	values.forEach(function(reducedData){ 
		Object.keys(reducedData).forEach(function(key) { 
			var value = reducedData[key]; data[key] ? data[key]+= value : data[key]= value; 
		}); 
	}); 
    } 
    else { 
	keys.forEach(function(key){ 
		data[key[0]] ? data[key[0]]++ : data[key[0]]=1;
	}); 
    }
 
    return data; 
}