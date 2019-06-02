Plotly.d3.csv('https://raw.githubusercontent.com/bitz1119/hackgtbit/master/data/dataset2.csv', function(err, rows){

  var classArray = unpack(rows, 'problem');
  var classes = [...new Set(classArray)];
  console.log(classes);
  console.log(classArray);
  function unpack(rows, key) {
    return rows.map(function(row) { return row[key]; });
  }

  var data = classes.map(function(classes) {
    var rowsFiltered = rows.filter(function(row) {
        return (row.problem === classes);
    });
    return {
       type: 'scattermapbox',
       name: classes,
       lat: unpack(rowsFiltered, 'Latitude'),
       lon: unpack(rowsFiltered, 'Longitude')
    };
  });
  console.log(data);
  console.log(rows);

  var layout = {
	 title: 'Road Condition Mapping',
	 font: {
		 color: 'white'
	 },
    dragmode: 'zoom',
    mapbox: {
      center: {
        lat: 52.3550,
        lon: -1.7439
      },
      domain: {
        x: [0, 1],
        y: [0, 1]
      },
      style: 'dark',
      zoom: 9
    },
    margin: {
      r: 20,
      t: 40,
      b: 20,
      l: 20,
      pad: 0
    },
    paper_bgcolor: '#191A1A',
    plot_bgcolor: '#191A1A',
    showlegend: true,
	 annotations: [{
		 x: 0,
       y: 0,
       xref: 'paper',
       yref: 'paper',
		 text: 'Road Condition Mapping',
		 showarrow: false
	 }]
  };

  Plotly.setPlotConfig({
    mapboxAccessToken: 'pk.eyJ1IjoicmlzaGFiLXNoYXJtYSIsImEiOiJjamVsNnh5N3QxZXcwMzNudWJ4YWM4eTJiIn0.eBysOBBUyW6GZvYCTLDSgQ'
  });

  Plotly.plot('graphDiv', data, layout);
});
