/**
 * This is the logic service for Cheat. The game state is represented by the
 * following elements:
 *      white, black, middle, claim, stage, "cards"
 *
 * White (player 0): It's an array and its elements are indexes of Cards indicating
 * the cards the white player are holding on.
 *
 * Black (player 1): It's an array and its elements are indexes of Cards indicating
 * the cards the black player are holding on.
 *
 * Middle: It's an array and its elements are indexes of Cards indicating
 * the cards in the middle area.
 *
 * Claim: An array with the following format [int, string] where the
 * first element is the number of cards and the second element is the rank of
 * the cards.
 *
 * Stage: "setUp", "doClaim", "claimCheater", "checkClaim", "endGame"
 *
 * "Cards": 52 objects representing 52 cards (no jokers) such as:
 * {key: "Card0", value: "C2"}
 * {key: "Card10", value: "DQ"}
 * {key: "Card20", value: "HK"}
 * {key: "Card30", value: "S6"}
 * {key: "Card40", value: null} // This card is not visible to the player...
 *
 * Here is the table of representation of suits and ranks in the game state:
 * Suits: CLUBS ---- C
 *        DIAMONDS - D
 *        HEARTS --- H
 *        SPADES --- S
 * Ranks: TWO ------ 2
 *        THREE ---- 3
 *        FOUR ----- 4
 *        FIVE ----- 5
 *        SIX ------ 6
 *        SEVEN ---- 7
 *        EIGHT ---- 8
 *        NINE ----- 9
 *        TEN ------ 10
 *        JACK ----- J
 *        QUEEN ---- Q
 *        KING ----- K
 *        ACE ------ A
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * There're four types of operations:
 *
 * (If there's a last claim, then the claimed rank must be close to or equal
 * to the last claimed rank...)
 * I. Doing a claim
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 1}}
 *      setBoard:
 *          1 - {set: {key: 'white', value: [0, 1, 2, ..., 21] }}
 *          2 - {set: {key: 'middle', value: [22, 23, 24, 25] }}
 *      setClaim:
 *          3 - {set: {key: 'claim', value: [4, A] }}
 *      setState:
 *          4 - {set: {key: 'stage', value: STAGE.DECLARE_CHEATER }}
 *      setVisibility to all claimed cards:
 *          5 - 8  {setVisibility: {key: 'card22', visibleToPlayerIndexes: []}...
 *
 * (Must claim a cheater if the opponent has no cards in his hand...)
 * II. Claiming a cheater
 *    a. Claiming player 0 cheater
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 1}}
 *      setState:
 *          1 - {set: {key: 'stage', value: STAGE.CHECK_CLAIM }}
 *      setVisibility of each card in the middle area to player 0:
 *          2 - 5 {setVisibility: {key: 'card22', visibleToPlayerIndexes: [0]}...
 *    b. Not claiming player 0 cheater
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 1}}
 *      setState:
 *          1 - {set: {key: 'stage', value: STAGE.DO_CLAIM }}
 *
 * III. Check if we had a cheater (Can be skipped by not claiming a cheater)
 *    a. Player 0 is cheater
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 1}}
 *      setBoard:
 *          1 - {set: {key: 'white', value: [0, 1, 2, ..., 25] }}
 *          2 - {set: {key: 'middle', value: [] }}
 *      setState:
 *          3 - {set: {key: 'stage', value: STAGE.DO_CLAIM }}
 *      setVisibility of each card in the middle area to player 0:
 *          4 - 7 {setVisibility: {key: 'card22', visibleToPlayerIndexes: [0]}...
 *    b. Player 0 is not cheater
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 1}}
 *      setBoard:
 *          1 - {set: {key: 'black', value: [22, 23,..., 51] }}
 *          2 - {set: {key: 'middle', value: [] }}
 *      setState:
 *          3 - {set: {key: 'stage', value: STAGE.DO_CLAIM }}
 *      setVisibility of each card in the middle area to player 0:
 *          4 - 7 {setVisibility: {key: 'card22', visibleToPlayerIndexes: [1]}...
 *
 * IV. Win the game by get rid of all cards. (White player wins)
 *      endMatch:
 *          0 - {endMatch: {endMatchScores: [1, 0]}}
 *
 * V. Initial move
 *      setTurn:
 *          0 - {setTurn: {turnIndex: 0}}
 *      setBoard:
 *          1 - {set: {key: 'white', value: [0, 1, 2, ..., 25] }}
 *          2 - {set: {key: 'black', value: [26, 27, ..., 51] }}
 *          3 - {set: {key: 'middle', value: [] }}
 *      setStage:
 *          4 - {set: {key: 'stage', value: STAGE.DO_CLAIM }}
 *      setCards:
 *          6 - {set: {key: 'card0', value: "C2" }}...
 *          57 - {set: {key: 'card51', value: "SA" }}
 *      shuffle
 *          5 - {shuffle: ["card0", ..., "card51"]}
 *      setVisibility:
 *          58 - {setVisibility: {key: 'card0', value: []}...
 *          109 - {setVisibility: {key: 'card52', value: []}
 *
 *
 * Note: Operation III, IV and V are automatically made in the right situation.
 */
// For unit tests...
angular.module('myApp', ['ngTouch', 'ui.bootstrap']).factory('gameLogic',
//angular.module('myApp').factory('cheatLogicService',
  function () {

    'use strict';

    /** Returns the initial board. */
    function getInitialBoard() {
        // TODO: return the initial board.
        return {};
      }


      /**
       * Check if the object is empty
       */
       function isEmptyObj(obj) {
        var prop;

        for (prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            return false;
          }
        }

        return true;
      }

      // Stage
      var STAGE = {
        SET_UP: "SET_UP",
        DO_CLAIM: "DO_CLAIM",
        DECLARE_CHEATER: "DECLARE_CHEATER",
        CHECK_CLAIM: "CHECK_CLAIM",
        END: "END"
      };

      // Suit
      var SUIT = {
        DIAMONDS: "D", //♦
        HEARTS: "H", //♥
        SPADES: "S", //♠
        CLUBS: "C" //♣
      };

      // Rank
      var RANK = {
        TWO: '2',
        THREE: '3',
        FOUR: '4',
        FIVE: '5',
        SIX: '6',
        SEVEN: '7',
        EIGHT: '8',
        NINE: '9',
        TEN: '10',
        JACK: 'J',
        QUEEN: 'Q',
        KING: 'K',
        ACE: 'A'
      };

      /**
       * Get possible ranks for claiming.
       * If the rank passed in is undefined, then there's no previous claim
       * and all ranks are selectable, otherwise only ranks 1 close to or
       * equal to the rank of the previous claim are selectable.
       * @param rank
       * @returns {Array}
       */
       function getRankArray(rank) {
        var res = [];

        for (var index in RANK) {
          if (angular.isUndefined(rank)) {
            // Return all ranks
            res.push(RANK[index]);
          } else {
            // Return 1 close ranks and itself
            if (isCloseRank(rank, RANK[index])) {
              res.push(RANK[index]);
            }
          }
        }

        return res;
      }

      /**
       * Get the rank score.
       * @param rank
       * @returns {number}
       */
       function getRankScore(rank) {
        switch (rank) {
          case '2':
          return 1;
          case '3':
          return 2;
          case '4':
          return 3;
          case '5':
          return 4;
          case '6':
          return 5;
          case '7':
          return 6;
          case '8':
          return 7;
          case '9':
          return 8;
          case '10':
          return 9;
          case 'J':
          return 10;
          case 'Q':
          return 11;
          case 'K':
          return 12;
          case 'A':
          return 13;
          default:
          throw new Error("Illegal rank!");
        }
      }

      /**
       * Concat two array by appending the later one to the former one...
       */
       Array.prototype.selfConcat = function(append) {
        check(append.constructor === Array);
        for (var i = 0; i < append.length; i++) {
          this.push(append[i]);
        }
      };

      /**
       * Subtract elements from original arrays
       */
       Array.prototype.selfSubtract = function(elementsToRemove) {
        var originalLength = this.length;
        this.removeAll(elementsToRemove);
        check(originalLength === this.length + elementsToRemove.length, "The elements are not proper removed...", this, elementsToRemove);
      };

      /**
       * Check if the array contains all the elements.
       */
       Array.prototype.containsAll = function(elementsToCheck) {
        check(elementsToCheck.constructor === Array, "The argument is not an array!");
        for (var i = 0; i < elementsToCheck.length; i++) {
          if (this.indexOf(elementsToCheck[i]) == -1) {
            return false;
          }
        }
        return true;
      };

      /**
       * Remove all elements from the array
       */
       Array.prototype.removeAll = function(elementsToRemove) {
        check(elementsToRemove.constructor === Array, "The argument is not an array!");
        check(this.containsAll(elementsToRemove), "The array does not contain all the elements.", this, elementsToRemove);
        for (var i = 0; i < elementsToRemove.length; i++) {
          var index = this.indexOf(elementsToRemove[i]);
          this.splice(index, 1);
        }
      };

      /**
       * Return a clone array
       */
       Array.prototype.clone = function() {
        return this.slice(0);
      };

      function check(val, description) {
        if (!val) {
          console.log(description);
          for (var i = 2; i < arguments.length; i++) {
            console.log(arguments[i]);
          }
          throw new Error('Fails!');
        }
      }

      /**
       * Get a card string according the index
       * @param i
       * @returns {*}
       */
       function getCard(i) {
        check(i >= 0 && i <52, "Illegal index");
        var suit,
        rank;

        if (i < 13) {
          suit = SUIT.CLUBS;
        } else if (i < 26) {
          suit = SUIT.DIAMONDS;
        } else if (i < 39) {
          suit = SUIT.HEARTS;
        } else if (i < 52) {
          suit = SUIT.SPADES;
        }

        switch (i % 13) {
          case 0:
          rank = RANK.TWO;
          break;
          case 1:
          rank = RANK.THREE;
          break;
          case 2:
          rank = RANK.FOUR;
          break;
          case 3:
          rank = RANK.FIVE;
          break;
          case 4:
          rank = RANK.SIX;
          break;
          case 5:
          rank = RANK.SEVEN;
          break;
          case 6:
          rank = RANK.EIGHT;
          break;
          case 7:
          rank = RANK.NINE;
          break;
          case 8:
          rank = RANK.TEN;
          break;
          case 9:
          rank = RANK.JACK;
          break;
          case 10:
          rank = RANK.QUEEN;
          break;
          case 11:
          rank = RANK.KING;
          break;
          case 12:
          rank = RANK.ACE;
          break;
        }

        return suit + rank;
      }

      /**
       * Check if the two rank are close by 1 or equal
       * @param rank
       * @param rankToCompare
       * @returns {boolean}
       */
       function isCloseRank(rank, rankToCompare) {
        var diff = Math.abs(getRankScore(rank) - getRankScore(rankToCompare));
        return diff <= 1;
      }

      /**
       * Ref: http://stackoverflow.com/questions/18806210/generating-non-repeating-random-numbers-in-js
       * Shuffle an array
       */
       function shuffle(array) {
        var i = array.length,
        j = 0,
        temp;

        while (i--) {

          j = Math.floor(Math.random() * (i+1));

          // swap randomly chosen element with current element
          temp = array[i];
          array[i] = array[j];
          array[j] = temp;

        }

        return array;
      }

      /**
       * Create computer move operations.
       */
       function createComputerMove(state, turnIndexBeforeMove) {
        var possibleMove = [];

        switch(state.stage) {
          case STAGE.DO_CLAIM:
          var claimedCardNum = state.black.length >= 4 ?
          (Math.floor(Math.random() * 4 + 1)) :
          (Math.floor(Math.random() * state.black.length + 1));
          var possibleClaimRanks = getRankArray(state.claim[1]);
          var claim = [claimedCardNum,possibleClaimRanks[Math.floor(Math.random() * possibleClaimRanks.length)]];
          var aiCards = state.black.clone();
          shuffle(aiCards);
          var claimedCards = aiCards.slice(0, claimedCardNum);
          possibleMove = getClaimMove(state, turnIndexBeforeMove, claim, claimedCards);
          break;
          case STAGE.DECLARE_CHEATER:
          var declareCheater = Math.random() > 0.5;
          if (getWinner(state) !== -1) {
                // Must declare cheater if the opponent empties all cards...
                declareCheater = true;
              }
              possibleMove = getDeclareCheaterMove(state, turnIndexBeforeMove, declareCheater);
              break;
              case STAGE.CHECK_CLAIM:
              possibleMove = getMoveCheckIfCheated(state, turnIndexBeforeMove);
              break;
            }

            return possibleMove;
          }

      /**
       * Return the winner's index, if no winner is present, return -1;
       */
       function getWinner(state) {
        if (state.white.length === 0) {
          return 0;
        } else if (state.black.length === 0) {
          return 1;
        } else {
          return -1;
        }
      }

      /**
       * Get the initial move which shuffles and deals all the cards.
       * @returns {Array}
       */
       function getInitialMove() {
        var operations = [],
        white = [],
        black = [],
        setCards = [],
        setVisibilities = [],
        shuffleKeys = [],
        i;

        for (i = 0; i < 26; i++) {
          white[i] = i;
        }
        for (i = 26; i < 52; i++) {
          black[i - 26] = i;
        }

        for (i = 0; i < 52; i++) {
          setCards[i] = {set: {key: 'card' + i, value: getCard(i)}};
          if (i < 26) {
            setVisibilities[i] = {setVisibility: {key: 'card' + i, visibleToPlayerIndexes: [0]}};
          } else {
            setVisibilities[i] = {setVisibility: {key: 'card' + i, visibleToPlayerIndexes: [1]}};
          }
          shuffleKeys[i] = 'card' + i;
        }

        operations.selfConcat([{setTurn: {turnIndex: 0}}]);
        operations.selfConcat([{set: {key: 'white', value: white}}]);
        operations.selfConcat([{set: {key: 'black', value: black}}]);
        operations.selfConcat([{set: {key: 'middle', value: []}}]);
        operations.selfConcat([{set: {key: 'stage', value: STAGE.DO_CLAIM}}]);
        operations.selfConcat(setCards);
        operations.selfConcat([{shuffle: {keys: shuffleKeys}}]);
        operations.selfConcat(setVisibilities);
        return operations;
      }

      /**
       * Get the move operations for declaring cheat
       */
       function getDeclareCheaterMove(state, turnIndexBeforeMove, declareCheater) {
        var operations = [];

        if (declareCheater) {
          // No skipping
          operations.selfConcat([{setTurn: {turnIndex: turnIndexBeforeMove}}]);
          operations.selfConcat([{set: {key: 'stage', value: STAGE.CHECK_CLAIM }}]);

          var setVisibilities = [];
          for (var i = 0; i < state.middle.length; i++) {
            setVisibilities.selfConcat([{setVisibility: {key: 'card' + state.middle[i], visibleToPlayerIndexes: [turnIndexBeforeMove]}}]);
          }
          operations.selfConcat(setVisibilities);
        } else {
          // Skip declaring cheater if the opponent does not empty all cards
          if (turnIndexBeforeMove === 0) {
            // White
            check(state.black.length !== 0);
          } else {
            check(state.white.length !== 0);
          }
          operations.selfConcat([{setTurn: {turnIndex: turnIndexBeforeMove}}]);
          operations.selfConcat([{set: {key: 'stage', value: STAGE.DO_CLAIM }}]);
        }
        return operations;
      }

      /**
       * Check if the claim is indeed a cheat...
       * @param state
       * @returns {boolean}
       */
      function didCheat(state) {
        var lastClaim = state.claim;
        var lastM = state.middle;
        for (var i = lastM.length - 1; i >= lastM.length - lastClaim[0]; i--) {
          if (state['card' + lastM[i]].substring(1) !== lastClaim[1]) {
            return true;
          }
        }
        return false;
      }

      function getMoveCheckIfCheated(state, turnIndexBeforeMove) {
        var loserIndex = didCheat(state) ? 1 - turnIndexBeforeMove : turnIndexBeforeMove,
        loserCards = [],
        loserNewCards,
        operations = [],
        setVisibilities = [];

        if (loserIndex === 0) {
          loserCards = state.white;
        } else {
          loserCards = state.black;
        }
        loserNewCards = loserCards.concat(state.middle);

        operations.selfConcat([{setTurn: {turnIndex: turnIndexBeforeMove}}]);

        if (loserIndex === 0) {
          operations.selfConcat([{set: {key: 'white', value: loserNewCards}}]);
        } else {
          operations.selfConcat([{set: {key: 'black', value: loserNewCards}}]);
        }

        operations.selfConcat([{set: {key: 'middle', value: []}}]);
        operations.selfConcat([{set: {key: 'stage', value: STAGE.DO_CLAIM}}]);

        for (var i = 0; i < state.middle.length; i++) {
          if (loserIndex === 0) {
            setVisibilities.selfConcat([{setVisibility: {key: 'card' + state.middle[i], visibleToPlayerIndexes: [0]}}]);
          } else {
            setVisibilities.selfConcat([{setVisibility: {key: 'card' + state.middle[i], visibleToPlayerIndexes: [1]}}]);
          }
        }

        operations.selfConcat([{set: {key: 'claim', value: -1}}]);
        operations.selfConcat(setVisibilities);

        return operations;
      }

      function getClaimMove(state, turnIndexBeforeMove, claim, cardsToMoveToMiddle) {
        // First check if number of cards claimed is legal and the number of
        // cards move to middle match the number of cards claimed
        check(cardsToMoveToMiddle.length >= 1 && cardsToMoveToMiddle.length <= 4);
        check(cardsToMoveToMiddle.length === claim[0]);

        var lastClaim = state.claim,
        lastWorB,
        newWorB,
        lastM,
        newM;

        if (!angular.isUndefined(lastClaim) && lastClaim !== -1) {
          // If the last claim exists, the rank of the latest claim must be
          // close or equal to the last claim.
          check(isCloseRank(lastClaim[1], claim[1]));
        }

        // Get the cards of the player who makes the claim
        if (turnIndexBeforeMove === 0) {
          lastWorB = state.white;
        } else {
          lastWorB = state.black;
        }

        newWorB = lastWorB.clone();
        newWorB.selfSubtract(cardsToMoveToMiddle);

        lastM = state.middle;
        newM = lastM.concat(cardsToMoveToMiddle);

        var operations = [];
        operations.selfConcat([{setTurn: {turnIndex: 1 - turnIndexBeforeMove}}]);
        if (turnIndexBeforeMove === 0) {
          operations.selfConcat([{set: {key: 'white', value: newWorB}}]);
          operations.selfConcat([{set: {key: 'middle', value: newM}}]);
        } else {
          operations.selfConcat([{set: {key: 'black', value: newWorB}}]);
          operations.selfConcat([{set: {key: 'middle', value: newM}}]);
        }
        var setVisibilities = [];
        for (var i = 0; i < cardsToMoveToMiddle.length; i++) {
          setVisibilities.selfConcat([{setVisibility: {key: 'card' + cardsToMoveToMiddle[i], visibleToPlayerIndexes: []}}]);
        }
        operations.selfConcat([{set: {key: 'claim', value: claim}}]);
        operations.selfConcat([{set: {key: 'stage', value: STAGE.DECLARE_CHEATER }}]);
        operations.selfConcat(setVisibilities);

        return operations;
      }

      function getWinMove(state) {
        var winner = getWinner(state);
        if (winner === 0) {
          return [{endMatch: {endMatchScores: [1, 0]}}]
        } else if (winner === 1) {
          return [{endMatch: {endMatchScores: [0, 1]}}]
        }
        throw new Error("No one wins!")
      }

      /**
       * Check if the move is OK.
       *
       * @param params the match info which contains stateBeforeMove,
       *              stateAfterMove, turnIndexBeforeMove, turnIndexAfterMove,
       *              move.
       * @returns return true if the move is ok, otherwise false.
       */
       function isMoveOk(params) {
        var stateBeforeMove = params.stateBeforeMove,
        turnIndexBeforeMove = params.turnIndexBeforeMove,
        move = params.move,
        expectedMove;

        /*********************************************************************
         * 1. If the stateBeforeMove is empty, then it should be the first
         *    move, set the board of stateBeforeMove to be the initial board.
         *    If the stateBeforeMove is not empty, then the move operations
         *    array should have a length of 4.
         ********************************************************************/

         try {
          switch (params.stateBeforeMove.stage) {
            case STAGE.DO_CLAIM:
            var claim = move[3].set.value;
            var lastM = stateBeforeMove.middle;
            var newM = move[2].set.value;
            var diffM = newM.clone();
            diffM.selfSubtract(lastM);
            expectedMove = getClaimMove(stateBeforeMove, turnIndexBeforeMove, claim, diffM);
            break;
            case STAGE.DECLARE_CHEATER:
            check(move[1].set.value === STAGE.DO_CLAIM || move[1].set.value === STAGE.CHECK_CLAIM);
            var declareCheater = move[1].set.value === STAGE.CHECK_CLAIM;
            expectedMove = getDeclareCheaterMove(stateBeforeMove, turnIndexBeforeMove, declareCheater);
            break;
            case STAGE.CHECK_CLAIM:
            expectedMove = getMoveCheckIfCheated(stateBeforeMove, turnIndexBeforeMove);
            break;
            case STAGE.END:
            expectedMove = getWinMove(stateBeforeMove);
            break;
            default:
            if (turnIndexBeforeMove != 0 || angular.isUndefined(stateBeforeMove)) {
              throw new Error("Illegal initial move!");
            }
            expectedMove = getInitialMove();
            break;
          }
        } catch (e) {
          return false;
        }

        if (!angular.equals(move, expectedMove)) {
          //console.log("=========MoveToCheck=========");
          //console.log(JSON.stringify(move));
          //console.log("=========ExpectMove=========");
          //console.log(JSON.stringify(expectedMove));
          //console.log("=========END=========");
          return false;
        }

        return true;
      }

      return {
        isMoveOk: isMoveOk,
        isEmptyObj: isEmptyObj,
        createComputerMove: createComputerMove,
        getInitialMove: getInitialMove,
        getClaimMove: getClaimMove,
        getDeclareCheaterMove: getDeclareCheaterMove,
        getMoveCheckIfCheated: getMoveCheckIfCheated,
        getWinMove: getWinMove,
        getRankScore: getRankScore,
        getCard: getCard,
        getWinner: getWinner,
        getRankArray: getRankArray,
        STAGE: STAGE
      };
    });
;angular.module('myApp')
  .controller('Ctrl',
      ['$scope', '$log', '$timeout',
       'gameService', 'gameLogic',
       'resizeGameAreaService', '$translate', 'dragAndDropService',
      function ($scope, $log, $timeout,
        gameService, gameLogic,
        resizeGameAreaService, $translate, dragAndDropService) {
    'use strict';

    $log.info($translate('RULES_OF_CHEAT')); // Example of using $translate

    // TODO: choose your width-to-height ratio (1 means the board is square).
    resizeGameAreaService.setWidthToHeight(1.7);

    var canMakeMove = false;
    var state = null;
    var turnIndex = null;
    // Get the stage objects for convenience
    var STAGE = gameLogic.STAGE;
    var draggingCard;
     // Return true if the card (index) is selected
    $scope.isSelected = function(card) {
      return $scope.middle.indexOf(card) !== -1;
    };

    // Return true if at least one card is selected
    $scope.hasSelectedCards = function() {
      // The cards in the middle area is more than the cards in the state's
      // original middle area
      return $scope.middle.length > $scope.state.middle.length;
    };

    // Return true if the card can be dragged/selected...
    $scope.canDrag = function (card) {
      if ($scope.isYourTurn && $scope.state.stage === STAGE.DO_CLAIM && $scope.state["card" + card] != null) {
        if ($scope.middle.indexOf(card) !== -1) {
          return true;
        } else if ($scope.middle.length - $scope.state.middle.length < 4) {
          return true;
        }
      }

      return false;
    };
    /*
    // Store the card for later use during drag and drop
    $scope.storeDraggingCard = function (card) {
      $scope.draggingCard = parseInt(card);
    };
    */
    // Select a card
    $scope.selectCard = function(card) {
      if ($scope.isYourTurn && $scope.state.stage === STAGE.DO_CLAIM) {
        if ($scope.playMode === 'passAndPlay' && $scope.currIndex == 1) {
          if ($scope.middle.indexOf(card) !== -1) {
            $scope.middle.splice($scope.middle.indexOf(card), 1);
            $scope.playerTwoCards.push(card);
          } else if ($scope.middle.length - $scope.state.middle.length < 4) {
            // Only select at most 4 cards!
            if ($scope.playerTwoCards.indexOf(card) !== -1) {
              $scope.playerTwoCards.splice($scope.playerTwoCards.indexOf(card), 1);
              $scope.middle.push(card);
            }
          }
        } else {
          // Must select in the player's turn
          if ($scope.middle.indexOf(card) !== -1) {
            // The card is already selected, hence cancel the selection
            // First delete the card in the middle area, then add it back
            // to the player one area
            $scope.middle.splice($scope.middle.indexOf(card), 1);
            $scope.playerOneCards.push(card);
          } else if ($scope.middle.length - $scope.state.middle.length < 4) {
            // Only select at most 4 cards!
            if ($scope.playerOneCards.indexOf(card) !== -1) {
              // Select the card.
              // First delete it from player one area, then add it to the
              // middle area
              $scope.playerOneCards.splice($scope.playerOneCards.indexOf(card), 1);
              $scope.middle.push(card);
            }
          }
        }
      }

      sortRanks();

      // In case the board is not updated
      if (!$scope.$$phase) {
        $scope.$apply();
      }

    };

    // Check the current stage
    $scope.checkStage = function(stage) {
      if (angular.isUndefined($scope.state)) {
        return false;
      }
      return $scope.state.stage === stage;
    };

    // Make a claim
    $scope.claim = function(rank) {
      //console.log('la');
      $scope.isClaimModalShown = false;
      var claim = [$scope.middle.length - $scope.state.middle.length, rank];
      var diffM = $scope.middle.clone();
      diffM.selfSubtract($scope.state.middle);
      var operations = gameLogic.getClaimMove($scope.state, $scope.currIndex, claim, diffM);
      gameService.makeMove(operations);
    };

    // Declare a cheater or pass
    $scope.declare = function (declareCheater) {

      $scope.isDeclareModalShown = false;
      var operations = gameLogic.getDeclareCheaterMove($scope.state, $scope.currIndex, declareCheater);
      gameService.makeMove(operations);
    };

    // Get the card data value for css usage
    $scope.getImageSrc = function(i) {
      if ($scope.state['card' + i] !== null) {
        var card = $scope.state['card' + i];
        var suit = card.substring(0, 1);
        var rank = card.substring(1);
      }
      switch(suit){
        case 'D': 
          suit = 'diamonds';
          break;
        case 'H':
          suit = 'hearts';
          break;
        case 'S':
          suit = 'spades';
          break;
        case 'C':
          suit = 'clubs';
          break;
        default:
          suit = '';
      }
      if (suit === ''){
        return 'imgs/cards/PNG-cards-1.3/back.jpg';
      }else{
        return 'imgs/cards/PNG-cards-1.3/'+rank+'_of_'+suit+'.jpg';
      }
    };

    // Sort the cards according to the ranks
    function sortRanks() {
      var sortFunction = function(cardA, cardB) {
        if ($scope.state["card" + cardA] !== null) {
          // Only sort the cards while they are not hidden
          var rankA = $scope.state["card" + cardA].substring(1);
          var rankB = $scope.state["card" + cardB].substring(1);
          var scoreA = gameLogic.getRankScore(rankA);
          var scoreB = gameLogic.getRankScore(rankB);
          return scoreA - scoreB;
        }
        return 1;
      };
      $scope.playerOneCards.sort(sortFunction);
      $scope.playerTwoCards.sort(sortFunction);
    }

    // Update the ranks for claiming
    function updateClaimRanks () {
      if (angular.isUndefined($scope.state.claim) && $scope.state.claim !== -1) {
        $scope.claimRanks = gameLogic.getRankArray();
      } else {
        var rank = $scope.state.claim[1];
        $scope.claimRanks = gameLogic.getRankArray(rank);
      }
      //$scope.claimRanks = gameLogic.getRankArray();
    }

    // Check the declaration
    function checkDeclaration() {
      var operations = gameLogic.getMoveCheckIfCheated($scope.state, $scope.currIndex);
      gameService.makeMove(operations);
    }

    // Check if there's a winner
    function hasWinner() {
      return gameLogic.getWinner($scope.state) !== -1;
    }

    // Check if the game ends, and if so, send the end game operations
    function checkEndGame() {
      if (hasWinner() && $scope.stage === STAGE.DO_CLAIM) {
        // Only send end game operations in DO_CLAIM stage
        var operation = gameLogic.getWinMove($scope.state);
        gameService.makeMove(operation);
      }
    }

    // Send computer move
    function sendComputerMove() {
      var operations = gameLogic.createComputerMove($scope.state, $scope.currIndex);
      if ($scope.currIndex === 1) {
        gameService.makeMove(operations);
      }
    }

     /**
     * This method update the game's UI.
     */
    function updateUI(params) {
      // If the state is empty, first initialize the board...
      if (gameLogic.isEmptyObj(params.stateAfterMove)) {
        if (params.yourPlayerIndex === 0) {
          if (params.playMode === "playBlack") {

          }
          gameService.makeMove(gameLogic.getInitialMove());
        }
        return;
      }

      // Get the new state
      $scope.state = params.stateAfterMove;
      // Get the current player index (For creating computer move...)
      $scope.currIndex = params.turnIndexAfterMove;
      $scope.isYourTurn = params.turnIndexAfterMove >= 0 && // game is ongoing
          params.yourPlayerIndex === params.turnIndexAfterMove; // it's my turn
      $scope.isAiMode = $scope.isYourTurn
          && params.playersInfo[params.yourPlayerIndex].playerId === '';
      $scope.playMode = params.playMode;

      // Get the cards for player one area, player two area and middle area
      $scope.middle = $scope.state.middle.clone();
      if (params.playMode === 'playAgainstTheComputer' || params.playMode === 'passAndPlay') {
        // If the game is played in the same device, use the default setting
        $scope.playerOneCards = $scope.state.white.clone();
        $scope.playerTwoCards = $scope.state.black.clone();
      } else {
        // Otherwise, player one area holds the cards for the player self
        if (params.yourPlayerIndex === 0) {
          $scope.playerOneCards =  $scope.state.white.clone();
          $scope.playerTwoCards = $scope.state.black.clone();
        } else {
          $scope.playerOneCards =  $scope.state.black.clone();
          $scope.playerTwoCards = $scope.state.white.clone();
        }
      }

      sortRanks();

      // In case the board is not updated
      if (!$scope.$$phase) {
        $scope.$apply();
      }

      // If the game ends, send the end game operation directly
      checkEndGame();

      if ($scope.isYourTurn) {
        updateClaimRanks();
        switch($scope.state.stage) {
          case STAGE.DO_CLAIM:
            break;
          case STAGE.DECLARE_CHEATER:
            if (params.playMode === 'passAndPlay' || $scope.currIndex == 0) {
              //$('#declareModal').modal('show');
              $scope.isDeclareModalShown = true;
            }
            break;
          case STAGE.CHECK_CLAIM:
            checkDeclaration();
            break;
          default:
        }
      }

      // Is it computer's turn?
      if ($scope.currIndex === 1 && $scope.isAiMode) {
        $scope.isYourTurn = false;
        $timeout(sendComputerMove, 1000);
      }

      // If the play mode is not pass and play then "rotate" the board
      // for the player. Therefore the board will always look from the
      // point of view of the player in single player mode...
      if (params.playMode === "playBlack") {
        $scope.rotate = true;
      } else {
        $scope.rotate = false;
      }

    }

    function sendUserMove(move) {
      if (!canMakeMove) {
        $log.info('User cannot make a move now! move=', move);
        return;
      }
      gameService.makeMove(move);
    }

    dragAndDropService.addDragListener("gameArea", handleDragEvent);


    var previousIndex = -1;
    var index;
    var holdCardType = 0; // 0 means not holding card, 1 means holding player1 card, 2 means holding player2 card, 3 means holding middle card
    var originalPosition;
    function handleDragEvent(type, clientX, clientY) {
      // Center point in gameArea
      var x = clientX - gameArea.offsetLeft;
      var y = clientY - gameArea.offsetTop;
      var xPercent = x / gameArea.clientWidth;
      var yPercent = y / gameArea.clientHeight;

      if (type === "touchstart"){
        if (yPercent < 0.93 && yPercent > 0.7 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.playerOneCards.length && index < $scope.playerOneCards.length + 5){
            index = $scope.playerOneCards.length - 1;
          }
          draggingCard = document.getElementById("playerOne" + index);
          if (draggingCard && $scope.canDrag($scope.playerOneCards[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '66%';
            draggingCard.style.zIndex = 1;
            holdCardType = 1;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else if (yPercent < 0.65 && yPercent > 0.4 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.middle.length && index < $scope.middle.length + 5){
            index = $scope.middle.length - 1;
          }
          draggingCard = document.getElementById("middle" + index);
          if (draggingCard && $scope.canDrag($scope.middle[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '36%';
            draggingCard.style.zIndex = 1;
            holdCardType = 3;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else if (yPercent < 0.3 && yPercent > 0.05 && !holdCardType){
          index = Math.floor(x / (playerOne0.clientWidth / 5));
          if (index >= $scope.playerTwoCards.length && index < $scope.playerTwoCards.length + 5){
            index = $scope.playerTwoCards.length - 1;
          }
          draggingCard = document.getElementById("playerTwo" + index);
          if (draggingCard && $scope.canDrag($scope.playerTwoCards[index])) {
            originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
            draggingCard.style.width = '12%';
            draggingCard.style.top = '0%';
            draggingCard.style.zIndex = 1;
            holdCardType = 2;
          } else {
            index = 0;
            draggingCard = null;
          }
        } else {
          index = 0;
          draggingCard = null;
        }
      } else if (type === "touchmove") {
        if (draggingCard) {
          if (holdCardType === 1){
            if (yPercent < 0.93 && yPercent > 0.7){
              draggingCard.style.width = '10%';
              draggingCard.style.left = originalPosition.left;
              draggingCard.style.top = originalPosition.top;
              draggingCard.style.zIndex = 'initial'; 
              index = Math.floor(x / (playerOne0.clientWidth / 5));
              if (index >= $scope.playerOneCards.length && index < $scope.playerOneCards.length + 5){
                index = $scope.playerOneCards.length - 1;
              }
              draggingCard = document.getElementById("playerOne" + index);
              if (draggingCard && $scope.canDrag($scope.playerOneCards[index])) {
                originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
                draggingCard.style.width = '12%';
                draggingCard.style.top = '66%';
                draggingCard.style.zIndex = 1;
                holdCardType = 1;
              }
            } else {
              draggingCard.style.left = (xPercent - 0.05) * 100 + '%';
              draggingCard.style.top = (yPercent - 0.15) * 100 + '%';
            }
          } else if (holdCardType === 2) {
            if (yPercent < 0.3 && yPercent > 0.05){
              draggingCard.style.width = '10%';
              draggingCard.style.left = originalPosition.left;
              draggingCard.style.top = originalPosition.top;
              draggingCard.style.zIndex = 'initial'; 
              index = Math.floor(x / (playerOne0.clientWidth / 5));
              if (index >= $scope.playerTwoCards.length && index < $scope.playerTwoCards.length + 5){
                index = $scope.playerTwoCards.length - 1;
              }
              draggingCard = document.getElementById("playerTwo" + index);
              if (draggingCard && $scope.canDrag($scope.playerTwoCards[index])) {
                originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
                draggingCard.style.width = '12%';
                draggingCard.style.top = '0%';
                draggingCard.style.zIndex = 1;
                holdCardType = 2;
              }
            } else {
              draggingCard.style.left = (xPercent - 0.05) * 100 + '%';
              draggingCard.style.top = (yPercent - 0.15) * 100 + '%';
            }
          } else if (holdCardType === 3) {
            if (yPercent < 0.65 && yPercent > 0.4){
              draggingCard.style.width = '10%';
              draggingCard.style.left = originalPosition.left;
              draggingCard.style.top = originalPosition.top;
              draggingCard.style.zIndex = 'initial'; 
              index = Math.floor(x / (playerOne0.clientWidth / 5));
              if (index >= $scope.middle.length && index < $scope.middle.length + 5){
                index = $scope.middle.length - 1;
              }
              draggingCard = document.getElementById("middle" + index);
              if (draggingCard && $scope.canDrag($scope.middle[index])) {
                originalPosition = {left: draggingCard.style.left, top: draggingCard.style.top};
                draggingCard.style.width = '12%';
                draggingCard.style.top = '36%';
                draggingCard.style.zIndex = 1;
                holdCardType = 3;
              }
            } else {
              draggingCard.style.left = (xPercent - 0.05) * 100 + '%';
              draggingCard.style.top = (yPercent - 0.15) * 100 + '%';
            }
          }

        }
      } else if (type === "touchend") {  
        if (holdCardType === 1){
          if (yPercent < 0.6 && yPercent > 0.4){
            $scope.selectCard($scope.playerOneCards[index]);
          } else if (draggingCard){
            draggingCard = document.getElementById("playerOne" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top;
            draggingCard.style.zIndex = 'initial'; 
          }
        } else if (holdCardType === 2){
          if (yPercent < 0.6 && yPercent > 0.4){
            $scope.selectCard($scope.playerTwoCards[index]);
          } else {
            draggingCard = document.getElementById("playerTwo" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top;
            draggingCard.style.zIndex = 'initial';  
          }
        } else if (holdCardType === 3){
          if ((yPercent < 0.93 && yPercent > 0.7) || (yPercent < 0.3 && yPercent > 0.05)){
            $scope.selectCard($scope.middle[index]);
          } else {
            draggingCard = document.getElementById("middle" + index);
            draggingCard.style.width = '10%';
            draggingCard.style.left = originalPosition.left;
            draggingCard.style.top = originalPosition.top; 
            draggingCard.style.zIndex = 'initial'; 
          }
        } 
        draggingCard = null;
        holdCardType = 0;
      } else {
        return;
      }
    }
    
    $scope.userClickedSomething = function (userChoices) {
      sendUserMove(gameLogic.createMove(state, turnIndex, userChoices));
    };

    gameService.setGame({
      minNumberOfPlayers: 2,
      maxNumberOfPlayers: 2,
      isMoveOk: gameLogic.isMoveOk,
      updateUI: updateUI
    });
  }]);
