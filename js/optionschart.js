 (function (root, factory) {
        root.OptionsChart = factory();
}(this, function () {

    var OptionsChart = {};

    OptionsChart.Graph = function(args) {

        var self = this;

        this.initialize = function(args) {

            if (!args.element) throw "OptionsChart.Graph needs a reference to an element";
            if (args.element.nodeType !== 1) throw "OptionsChart.Graph element was defined but not an HTML element";


            this.defaults = {
                payoffLineColor: 'black',
                payoffLineWidth: 4, 
                height: 400,
                width: 800,
                padding: 30,
                boundsMargin: 20
            };

            this.element = args.element;
            this.payoffLineColor = args.payoffLineColor || this.defaults.payoffLineColor;
            this.payoffLineWidth = args.payoffLineWidth || this.defaults.payoffLineWidth;
            this.height = args.height || this.defaults.height;
            this.width = args.width || this.defaults.width;
            this.padding = this.defaults.padding;
            this.boundsMargin = args.boundsMargin || this.defaults.boundsMargin;
            this.titleText = args.titleText || ''

            this.initializeProductData();

        };

        this.initializeProductData = function(){
            this.products = args.products.products;
            this.dataset = args.products.dataset;

            this.lowprice = args.products.lowprice;
            this.highprice = args.products.highprice;
            this.payoffData = args.products.payoffData;
        };

        this.render = function() {
            this.createChart();
            this.createScale();
            this.createAxis();
            this.createTitle();
            this.renderData();     
        };

        this.createChart = function(){
            this.vis = d3.select(this.element).attr("height", this.height).attr("width", this.width);
        };

        this.createScale = function() {
            this.xScale = d3.scale.linear().domain([this.lowprice, this.highprice]).range([this.padding, this.width - this.padding]);
            this.yScale = d3.scale.linear().domain([-20, 20]).range([this.height - this.padding, this.padding]);
        };

        this.renderData = function() {

             var lineGen = d3.svg.line()
                 .x(function(d) {
                     return self.xScale(d.price);
                 })
                 .y(function(d) {
                     return self.yScale(d.profit);
                 })
                 .interpolate("linear");

             this.dataset.forEach(function(eachline) {
                 self.vis.append('svg:path')
                     .attr('class', 'optionline')
                     .attr('d', lineGen(eachline))
                     .attr('stroke', 'blue')
                     .attr('stroke-width', 2)
                     .style('stroke-dasharray', (3, 3))
                     .attr('fill', 'none');
             });

             this.vis.append('svg:path')
                 .attr('class', 'optionline')
                 .attr('d', lineGen(this.payoffData))
                 .attr('stroke', 'black')
                 .attr('stroke-width', 4)
                 .attr('fill', 'none');

        };

        this.createAxis = function() {

            var xAxis = d3.svg.axis()
                .scale(this.xScale)
                .outerTickSize(0)
                .tickFormat(function(d) { return "$" + d; })
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(this.yScale)
                .tickFormat(function(d) { return "$" + d; })
                .orient("left");

            this.vis.append("svg:g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (this.height) / 2 + ")")
                .call(xAxis);
            this.vis.append("svg:g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + (this.padding) + ",0)")
                .call(yAxis);

            // remove first tick on x axis for aesthetics
            this.vis.selectAll(".tick")
                .filter(function(d) {
                    return d === self.lowprice;
                })
                .remove();

        };

        this.createTitle = function() {

            this.vis.append("text")
                .attr("x", (this.width/2))
                .attr("y", this.padding)
                .attr("text-anchor", "middle")
                .attr("class", "options_chart_title")
                .text(this.titleText)
        };

        this.initialize(args);

    };


    OptionsChart.Product = function(args) {

        var self = this;

        this.dataset = [];
        this.products = [];

        function Stock(ticker, purchase, price) {
            this.ticker = ticker;
            this.purchase = purchase;
            this.price = price;
        };

        function StockOption(ticker, purchase, price, optiontype, strike) {
            Stock.call(this, ticker, purchase, price);

            this.optiontype = optiontype;
            this.strike = strike;
        };


        this.createStock = function(args) {
            if (!args.purchase) throw 'OptionsChart.Product needs a purchase value';
            if (!args.price) throw 'OptionsChart.Product needs a price value';

            var price = args.price;
            var purchase = args.purchase;
            var ticker = args.ticker || '';

            var stock = new Stock(ticker,purchase,price);

            this.products.push(stock);
            this.createRange();
            this.createDataset();
            this.createPayoff();
        };

        this.createOption = function(args){
  
            if (!args.purchase) throw 'OptionsChart.Product needs a purchase value';
            if (!args.price) throw 'OptionsChart.Product needs a price value';
            if (!args.optiontype) throw 'OptionsChart.Product needs an optiontype value';
            if (!args.strike) throw 'OptionsChart.Product needs a strike value';

            var price = args.price;
            var purchase = args.purchase;
            var optiontype = args.optiontype;
            var strike = args.strike;
            var ticker = args.ticker || '';

            var option = new StockOption(ticker, purchase, price, optiontype, strike);

            this.products.push(option);
            this.createRange();
            this.createDataset();
            this.createPayoff();
        };

        this.createPayoff = function() {
             var allInflectionPts = [this.lowprice, this.highprice];
             var profits = [];
             this.payoffData = [];

             function sortNumber(a, b) {
                 return a - b;
             }

             // get inflection points and sort
             this.products.forEach(function(product) {
                 if (product instanceof StockOption) {
                     allInflectionPts.push(product.strike);
                 };
             });

             allInflectionPts.sort(sortNumber);

             allInflectionPts.forEach(function(pt, i) {
                 profits.push(0);
             });

             // calculate overall payoff for each inflection point
             this.products.forEach(function(product) {
                 allInflectionPts.forEach(function(pt, i) {
                     profits[i] += self.calculatePayoff(product, pt);
                 });
             });

             allInflectionPts.forEach(function(pt, i) {
                 self.payoffData.push({
                     'price': pt,
                     'profit': profits[i]
                 });
             });
        };

        this.createDataset = function() {

                 var datum;
                 var low, inflection, high;
                 this.dataset = [];

                 this.products.forEach(function(item) {

                     low = {
                         'price': self.lowprice,
                         'profit': self.calculatePayoff(item, self.lowprice)
                     };
                     high = {
                         'price': self.highprice,
                         'profit': self.calculatePayoff(item, self.highprice)
                     };

                     if (item instanceof StockOption) {
                         inflection = {
                             'price': item.strike,
                             'profit': self.calculatePayoff(item, item.strike)
                         };
                         datum = [low, inflection, high];
                     } else {
                         datum = [low, high];
                     };

                     self.dataset.push(datum);
                 });
        };

        this.calculatePayoff = function (product, price) {

             var profit;

             if (product instanceof StockOption) {

                 if (product.optiontype === 'call') {
                     if (price <= product.strike) {
                         profit = -product.price;
                     } else {
                         profit = price - product.strike - product.price;
                     };

                 } else { // if a put option
                     if (price < product.strike) {
                         profit = price - product.strike + product.price;
                     } else {
                         profit = product.price;
                     };

                 };

             } else {
                 profit = price - product.price;
             };


             if (product.purchase === 'sell') {
                 profit = -profit;
             };

             return profit;
        };

        this.createRange = function() {

                 var highval = this.highval || 0;
                 var lowval = this.lowval || 9999999;

                 this.products.forEach(function(item) {
                     if (item.optiontype) {
                         highval = highval < item.strike ? item.strike : highval;
                         lowval = lowval > item.strike ? item.strike : lowval;
                     } else {
                         highval = highval < item.price ? item.price : highval;
                         lowval = lowval > item.price ? item.price : lowval;
                     };

                 });

                 this.highprice = highval+15;
                 this.lowprice = lowval-15;

        };

    };


    return OptionsChart;


}));
