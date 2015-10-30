# OptionsChart
An options charting library built on top of D3.js

 
#### Tech Overview

- D3.js
- Javascript
 
#### Features

- Automatic axis scaling
- Quick rendering of options graph
- Simple API

#### Basic Example 

![ScreenShot](https://raw.githubusercontent.com/thess24/OptionsChart/master/screenshots/screenshot.png)
 
 ```sh
<svg id='options_chart'></svg>

<script type="text/javascript" src="js/d3.min.js"></script>
<script type="text/javascript" src="js/optionschart.js"></script>
<script type="text/javascript">

    var twx = new OptionsChart.Product();
    twx.createStock( {ticker:'TWX', purchase: 'buy', price: 72} );
    twx.createOption( {ticker:'TWX', purchase: 'sell', price: 7, optiontype: 'call', strike: 74} );

    var args = {    element:document.querySelector('#options_chart'), 
                    titleText:'TWX Options Payoff vs Price',
                    products:twx    };

    var graph = new OptionsChart.Graph( args );
    graph.render();

</script>
```

#### Arugments
 
 - element
 - payoffLineColor
 - payoffLineWidth
 - height
 - width
 - padding
 - boundsMargin
 - titleText
 
#### Want to contribute?
These problems still havent been tackled yet
- Legend
- Line Colors/Attributes
- Bounding box
