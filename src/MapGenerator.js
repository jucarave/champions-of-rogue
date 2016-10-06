'use strict';

var PRNG = require('./PRNG');

class Room {
    constructor(x, y, w, h, room=true) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        
        this.room = room;
        this.doors = [];
        
        this.north = false;
        this.west = false;
        this.south = false;
        this.east = false;
        
        this.active = true;
    }
    
    checkSide(side) {
        if (side == 0 && this.west){ return false; }else
        if (side == 1 && this.north){ return false; }else
        if (side == 2 && this.east){ return false; }else
        if (side == 3 && this.south){ return false; }
        
        return true;
    }
    
    hasSides() {
        return !(this.west && this.north && this.south && this.east);
    }
    
    setSide(side) {
        if (side == 0){ this.west = true; }else
        if (side == 1){ this.north = true; }else
        if (side == 2){ this.east = true; }else
        if (side == 3){ this.south = true; }
    }
}

module.exports = {
    seed: null,
    prng: null,
    
    map: null,
    rooms: null,
    player: null,
    stairsUp: null,
    stairsDown: null,
    instances: null,
    
    init: function(seed=null) {
        this.map = null;
        this.rooms = null;
        this.player = null;
        this.stairsUp = null;
        this.stairsDown = null;
        this.instances = null;
    
        this.prng = new PRNG(seed);
        this.seed = this.prng.seed;
    },
    
    createGrid: function(size) {
        var grid = new Array(size[1]);
        
        for (var y=0;y<size[1];y++){
            grid[y] = new Array(size[0]);
            grid[y].fill(0);
        }
        
        return grid;
    },
    
    createStartRoom: function(level) {
        var room;
        if (level == 1) {
            room = new Room(40, 24, 6, 6);
            room.south = true;
        }else {
            var x, y, w, h;
            x = Math.floor(this.prng.random() * 60);
            y = Math.floor(this.prng.random() * 10);
            w = 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            
            room = new Room(x, y, w, h);
        }
        
        return room;
    },
    
    isOutOfBounds: function(x, y, w, h) {
        return (x < 0 || y < 0 || x + w >= 85 || y + h >= 30);
    },
    
    isCollision: function(x, y, w, h, ignore) {
        for (var i=0,r;r=this.rooms[i];i++) {
            if (r == ignore){ continue; }
            
            if (x + w < r.x){ continue; }
            if (y + h < r.y){ continue; }
            if (x >= r.x + r.w){ continue; }
            if (y >= r.y + r.h){ continue; }
            
            return true;
        }
        
        return false;
    },
    
    createRoom: function(room, side, isRoom=true) {
        var door_x, door_y, x, y, w, h;
        if (side == 0) {
            door_x = room.x;
            door_y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            w = 5 + Math.floor(this.prng.random() * 5);
            h = (!isRoom)? 3 : 5 + Math.floor(this.prng.random() * 5);
            x = room.x - w + 1;
            y = door_y - Math.floor(h / 2);
            
            if (this.isOutOfBounds(x, y, w, h)){ return null; }
            if (this.isCollision(x, y, w, h, room)){ return null; }
            
            side = 2;
            room.west = true;
        }else if (side == 1) {
            door_x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            door_y = room.y;
            w = (!isRoom)? 3 : 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            x = door_x - Math.floor(w / 2);
            y = room.y - h + 1;
            
            if (this.isOutOfBounds(x, y, w, h)){ return null; }
            if (this.isCollision(x, y, w, h, room)){ return null; }
            
            side = 3;
            room.north = true;
        }else if (side == 2) {
            door_x = room.x + room.w - 1;
            door_y = room.y + 1 + Math.floor(this.prng.random() * (room.h - 2));
            w = 5 + Math.floor(this.prng.random() * 5);
            h = (!isRoom)? 3 : 5 + Math.floor(this.prng.random() * 5);
            x = room.x + room.w - 1;
            y = door_y - Math.floor(h / 2);
            
            if (this.isOutOfBounds(x, y, w, h)){ return null; }
            if (this.isCollision(x, y, w, h, room)){ return null; }
            
            side = 0;
            room.east = true;
        }else if (side == 3) {
            door_x = room.x + 1 + Math.floor(this.prng.random() * (room.w - 2));
            door_y = room.y + room.h - 1;
            w = (!isRoom)? 3 : 5 + Math.floor(this.prng.random() * 5);
            h = 5 + Math.floor(this.prng.random() * 5);
            x = door_x - Math.floor(w / 2);
            y = room.y + room.h - 1;
            
            if (this.isOutOfBounds(x, y, w, h)){ return null; }
            if (this.isCollision(x, y, w, h, room)){ return null; }
            
            side = 1;
            room.south = true;
        }
        
        var hall = new Room(x, y, w, h, isRoom);
        hall.setSide(side);
        
        room.doors.push({x: door_x, y: door_y, room: hall});
        hall.doors.push({x: door_x, y: door_y, room: room});
        
        return hall;
    },
    
    connectEmptyHallways: function() {
        for (var i=0,r;r=this.rooms[i];i++) {
            if (r.room){ continue; }
            if (r.doors.length > 1){ continue; }
            
            var newRoom = null;
            var tries = 0;
            while (!newRoom && tries++ < 10){
                var side = Math.floor(this.prng.random() * 4);
                while (!r.checkSide(side)) {
                    side = Math.floor(this.prng.random() * 4);
                }
                
                newRoom = this.createRoom(r, side);
            }
            
            if (newRoom){
                this.rooms.push(newRoom);
            }
        }
    },
    
    renderOnMap: function() {
        var map = this.map;
        
        for (var i=0,r;r=this.rooms[i];i++) {
            for (var y=r.y;y<r.y+r.h;y++) {
                for (var x=r.x;x<r.x+r.w;x++) {
                    var t = (y == r.y || x == r.x || y == r.y+r.h-1 || x == r.x+r.w-1)? 4 : 1;
                    map[y][x] = t;
                }
            }
            
            for (var j=0,dr;dr=r.doors[j];j++) {
                if (!dr.room.active){ continue; }
                map[dr.y][dr.x] = 1;
            }
        }
    },
    
    createPlayerPosition: function(level) {
      var r = this.rooms[0];
      
      if (level == 1) {
          this.player = {
              x: 43,
              y: 28
          };
      }else{
          this.player = {
              x: r.x + 2 + Math.floor(this.prng.random() * (r.w - 4)),
              y: r.y + 2 + Math.floor(this.prng.random() * (r.h - 4))
          };
      }
    },
    
    createStairs: function(level) {
      if (level > 1) {
          this.stairsUp = {
              x: this.player.x,
              y: this.player.y
          };
      }
      
      var room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
      while (!room.room){
        room = this.rooms[1 + ((this.prng.random() * (this.rooms.length - 1)) << 0)];
      }
      
      this.stairsDown = {
          x: room.x + 2 + Math.floor(this.prng.random() * (room.w - 4)),
          y: room.y + 2 + Math.floor(this.prng.random() * (room.h - 4))
      };
    },
    
    generateMap: function(level) {
        var size = [75 + 20 * level, 20 + 10 * level];
        this.map = this.createGrid(size);
        this.rooms = [this.createStartRoom(level)];
        
        var roomsTarget = 14 + level;
        var roomsCreated = 1;
        
        console.log(size);
        console.log(roomsTarget);
        console.log("-----------------");
        
        var tries = 0;
        while (roomsCreated < roomsTarget) {
            if (tries++ >= 100) {
                break;
            }
            
            var r = this.rooms[(this.prng.random() * this.rooms.length) << 0];
            while (!r.hasSides()){
                r = this.rooms[(this.prng.random() * this.rooms.length) << 0];
            }
            
            var side = Math.floor(this.prng.random() * 4);
            while (!r.checkSide(side)) {
                side = Math.floor(this.prng.random() * 4);
            }
            
            var feature = Math.floor(this.prng.random() * 2);
            var newRoom;
            if (feature == 0) {
                newRoom = this.createRoom(r, side, false);
                if (newRoom){
                    tries = 0;
                    this.rooms.push(newRoom);
                }
            } else {
                newRoom = this.createRoom(r, side);
                if (newRoom){
                    tries = 0;
                    this.rooms.push(newRoom);
                    roomsCreated += 1;
                }
            }
        }
        
        this.connectEmptyHallways();
        
        this.createPlayerPosition(level);
        this.createStairs(level);
        
        this.renderOnMap();
        
        return {
            map: this.map,
            player: this.player,
            stairsUp: this.stairsUp,
            stairsDown: this.stairsDown
        };
    }
};