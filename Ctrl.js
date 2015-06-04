angular.module('myApp', [])
  .run(['$log', '$rootScope',
      function ($log, $rootScope) {
  'use strict';

  var initCoords = {x:0, y:0};
  var images = {};
  var suit, rank, SUIT, RANK;
  var cardWidth, cardHeight;
  var cards = [{'suit':'H', 'rank':6, 'visibleToPlayer1':true, 'visibleToPlayer2':false},
               {'suit':'C', 'rank':12, 'visibleToPlayer1':true, 'visibleToPlayer2':false},
               {'suit':'S', 'rank':1, 'visibleToPlayer1':true, 'visibleToPlayer2':false}];

  initDraw(cards);

  function initDraw(cards){
    var sources = {};
    var positions = [];
    for (var i = 0; i < cards.length; i++){
      suit = cards[i].suit;
      rank = cards[i].rank;
      // Get the file name
      switch (suit){
        case 'H':
          SUIT = 'hearts';
          break;
        case 'S':
          SUIT = 'spades';
          break;
        case 'C':
          SUIT = 'clubs';
          break;
        case 'D':
          SUIT = 'diamonds';
          break;
      }
      RANK = rank;
      if (!cards[i].visibleToPlayer1){
        sources[i] = 'imgs/Playing Cards/PNG-cards-1.3/back.png';  
      }else{
        sources[i] = 'imgs/Playing Cards/PNG-cards-1.3/' + RANK +'_of_' + SUIT + '.png';  
      }
    }

    var loadedImages = 0;
    var numImages = cards.length;

    for(var src in sources) {
      images[src] = new Image();
      images[src].onload = function() {
        var stage = new Kinetic.Stage({
          container: "container",
          width: 320,
          height: 568
        });
        var layer = new Kinetic.Layer();
        
        for(var src in sources) {
          var cardImg = new Kinetic.Image({
            image: images[src],
            x: 0 + src * 20,
            y: 0,
            width: 100,
            height: 137,
            draggable: true
          });
          
          cardImg.on('dragstart', function(e) {
            initCoords = {x:e.target.x(), y:e.target.y()};
            console.log(cardImg.getPosition());

          });
          cardImg.on('dragend', function(e) {
            onDragEnd(e);
          });

          layer.add(cardImg);
        }
      stage.add(layer);
    };
    images[src].src = sources[src];
    }
  }

  function onDragEnd(e) {
    var draggable = e.target;  
    var tween = new Kinetic.Tween({
      node: draggable, 
      duration: 0.2,
      x: initCoords.x,
      y: initCoords.y
    });
    console.log(initCoords);
    tween.play();
  }
}]);




















