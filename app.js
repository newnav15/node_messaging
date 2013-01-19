
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , amqp = require('amqp')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

 

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  
});


server.listen(app.get('port'));

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', function(req, res){
	  res.render('index', {
	      title: 'Welcome to application powered by RabbitMQ, Node, Express, Jade'
	    })
});

app.post('/test', function(req, res){
  var myText = req.body.myText;
  exchange.publish('my_queue1', {data:myText});
  console.log("publish done on RabbitMQ........"+req.body.myText);
  res.redirect('/');
});
    
console.log("Starting ... AMQP");

//1 create connection with amqp
var conn = amqp.createConnection({ host: 'localhost' });
conn.on('ready', setup);

//2 define the exchange
var exchange;
function setup() {
 	exchange = conn.exchange('my_exchange1', {'type': 'fanout', durable: false}, exchangeSetup);
}

//3 define the queue
var queue;
var deadQueue;
function exchangeSetup() {
    queue = conn.queue('my_queue1', {durable: false, exclusive: true},queueSetup);
    deadQueue = conn.queue('my_queue2', {durable: false, exclusive: true},queueSetup);
	queue.on('queueBindOk', function() { onQueueReady(exchange); });
}

//4 subscribe on queue and bind exchange and q
function queueSetup() {
	 queue.subscribe(function(msg) {
	     	console.log("msg from q is=="+msg.data);
	        //send socket io here....................
	        emitEvent(msg.data);
	    });
	  queue.bind(exchange.name, 'my_queue1');
	   deadQueue.bind(exchange.name, 'my_queue2');
	  
 }

//5 queue ready event
function onQueueReady(exchange){
	console.log("queue binding done...........................");
}

//6 emitEvent to client
function emitEvent(data){
	io.sockets.on('connection', function (socket) {
		console.log("emitting event now from server..........."+data);
		//socket.emit('event1', data);
		io.sockets.emit('event1', data);//instant update without page refresh
	});	
	
}
