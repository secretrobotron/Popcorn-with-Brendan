(function() {
  var WebGLFX = this.WebGLFX = {};
  WebGLFX.animations = [];
  WebGLFX.scene = null;
  WebGLFX.init = function(canvas, sc, popcorn) {
    WebGLFX.scene = sc;
    canvas.addEventListener('click', WebGLFX.onCanvasClick, false);
    WebGLFX.mvc = new CubicVR.MouseViewController(canvas, sc.camera);
    WebGLFX.popcorn = popcorn;
  }; //init

  WebGLFX.imageWheelItems = [];

  WebGLFX.aboutAnimFn = null;

  WebGLFX.showLink = function(){};
  WebGLFX.showSource = function(){};
  WebGLFX.hideSource = function(){};

  WebGLFX.about = function(animationFn) {
    if (WebGLFX.scene) {
      var camera = WebGLFX.scene.camera
      if (camera.target[2] < camera.position[2]) {
        WebGLFX.aboutAnimFn = animationFn;
        return WebGLFX.animate(camera, {
        prop: 'rotation', 
            timeStart: WebGLFX.currentTime,
          timeEnd: WebGLFX.currentTime + 2,
          start: 0,
          end: Math.PI/2,
          fn:function(obj, index, animation) {
            var i = Math.sin(index) * Math.PI;
            obj.target = [obj.position[0] + Math.sin(i), 0, obj.position[2] - Math.cos(i)];
          }
        });
      }
      else {
        return WebGLFX.animate(camera, {
        prop: 'rotation', 
            timeStart: WebGLFX.currentTime,
          timeEnd: WebGLFX.currentTime + 2,
          start: 0,
          end: Math.PI/2,
          fn:function(obj, index, animation) {
            var i = Math.PI + Math.sin(index) * Math.PI;
            obj.target = [obj.position[0] + Math.sin(i), 0, obj.position[2] - Math.cos(i)];
            if (index === Math.PI/2) {
              WebGLFX.aboutAnimFn = null;
            } //if
          }
        });
      } //if
    } //if
  }; //about
  
  function Animation(obj, input) {
    this.prop = input.prop;
    this.start = input.start;
    this.end = input.end;
    this.fn = input.fn;
    this.index = input.start;
    this.time = input.time;
    this.timeStart = input.timeStart;
    this.timeEnd = input.timeEnd;
    this.duration = input.timeEnd - input.timeStart;
    this.obj = obj;

    var that = this;
    this.update = function(time) {
      var timeIndex = (time-that.timeStart)/this.duration;
      that.index = that.start + (that.end - that.start)*timeIndex;
      that.fn(that.obj, that.index, that);
    }; //update
    this.fire = function(time) {
      that.fn(that.obj, time, that);
    }; //fire
  }; //Animation

  WebGLFX.properties = [];
  WebGLFX.register = function(obj, property, value) {
    WebGLFX.properties[obj.name + property] = value;
  }; //register
  WebGLFX.check = function(obj, property) {
    return WebGLFX.properties[obj.name + property];
  }; //check

  WebGLFX.animate = function(obj, input, force) {
    if (!(input.prop)) return;
    var name = input.name || obj.name;
    if (WebGLFX.animations[name] === undefined) {
      WebGLFX.animations[name] = [];
    } //if
    if (WebGLFX.animations[name][input.prop] === undefined || force) {
      WebGLFX.animations[name][input.prop] = new Animation(obj, input);
      return true;
    }
    else {
      return false;
    } //if
  }; //animate

  WebGLFX.fire = function(obj, input, force) {
    WebGLFX.animate(obj, input, force);
  }; //fire

  WebGLFX.__uuid = 0;
  WebGLFX.uuid = function() {
    var id = WebGLFX.__uuid;
    ++WebGLFX.__uuid;
    return id;
  }; //uuid

  WebGLFX.hits = [];
  WebGLFX.currentTime = 0;
  WebGLFX.update = function(time, frames) {
    if (WebGLFX.scene === null) return;
    if (WebGLFX.aboutAnimFn) {
      WebGLFX.aboutAnimFn();
    } //if
    var scene = WebGLFX.scene;
    WebGLFX.currentTime = time;
    for (var i in WebGLFX.animations) {
      var objAnims = WebGLFX.animations[i];
      for (var j in objAnims) {
        if (objAnims[j].time && time >= objAnims[j].time) {
          objAnims[j].fire(time);
          delete objAnims[j];
        }
        else if (time >= objAnims[j].timeStart) {
          objAnims[j].update(time);
          if (time >= objAnims[j].timeEnd) {
            objAnims[j].update(objAnims[j].timeEnd);
            delete objAnims[j];
          } //if
        } //if
      } //for j
    } //for i

    if (frames && frames % 3 === 0) {
      var ratio = window.innerWidth/window.innerHeight;
      var pos = [ scene.camera.position[0],
                  scene.camera.position[1],
                  scene.camera.position[2]];
      for (var i=0; i<WebGLFX.hits.length; ++i) {
        var hit = WebGLFX.hits[i].obj;
        if (hit.name === 'videoPlane') continue;
        if (hit.mouseState === 'over') {
          hit.mouseState = 'stale';
        } //if
      } //for

      var hits = scene.bbRayTest(pos, WebGLFX.mvc.getMousePosition(), 3);
      if (hits.length > 0) {
        document.body.style.cursor = 'pointer';

        var minDist = 4981234;
        var minLinkObj = null;
        for (var i=0; i<hits.length; ++i) {
          if (hits[i].dist < minDist) {
            minDist = hits[i].dist;
            minLinkObj = hits[i].obj;
          } //if
          var sceneObject = hits[i].obj;
          if (sceneObject.name === 'videoPlane') {
            continue;
          } //if
          var oldMouseState = sceneObject.mouseState;
          sceneObject.mouseState = 'over';
          if (oldMouseState !== 'stale') {
            WebGLFX.animate(sceneObject, {
              prop: 'scale', 
              timeStart: time,
              timeEnd: time + .05,
              start: 1,
              end: 1.2,
              fn:function(obj, index, animation){
                obj.scale = [index, index, 1];
              }
            }, true);
          } //if
        } //for
        
        if (minLinkObj.name === 'videoPlane') {
          WebGLFX.showLink('Play/Pause');
        }
        else if (WebGLFX.links[minLinkObj.name]){
          WebGLFX.showLink('<a href="'+WebGLFX.links[minLinkObj.name]+'">'+WebGLFX.links[minLinkObj.name]+'</a>');
        } //if

      }
      else {
        document.body.style.cursor = 'default';
      } //if

      for (var i=0; i<WebGLFX.hits.length; ++i) {
        var hit = WebGLFX.hits[i].obj;
        if (hit.name === 'videoPlane') continue;
        if (hit.mouseState === 'stale') {
          hit.mouseState = 'clear';
          WebGLFX.animate(hit, {
            prop: 'scale', 
            timeStart: time,
            timeEnd: time + .05,
            start: hit.scale[0],
            end: 1,
            fn:function(obj, index, animation){
              obj.scale = [index, index, 1];
            }
          }, true);
        } //if
      } //for
      WebGLFX.hits = hits;
    } //if
  }; //update

  WebGLFX.links = [];
  WebGLFX.registerLink = function(obj, link) {
    WebGLFX.links[obj.name] = link;
  };
  WebGLFX.unregisterLink = function(obj) {
    delete WebGLFX.links[obj.name];
  };

  WebGLFX.playing = true;
  WebGLFX.play = function() {
    for (var j=0; j<WebGLFX.popcorn.length; ++j) {
      WebGLFX.popcorn[j].play();
    } //for
    WebGLFX.playing = true;
  }; //play
  WebGLFX.pause = function() {
    for (var j=0; j<WebGLFX.popcorn.length; ++j) {
      WebGLFX.popcorn[j].pause();
    } //for
    WebGLFX.playing = false;
  }; //pause

  WebGLFX.onCanvasClick = function(e) {
    var hits = WebGLFX.hits;
    for (var i=0; i<hits.length; ++i) {
      var obj = hits[i].obj;
      if (obj.name === 'videoPlane') {
        if (WebGLFX.playing === true) {
          WebGLFX.pause();
        }
        else {
          WebGLFX.play();
        } //if
      }
      else if (WebGLFX.links[obj.name]) {
        window.open(WebGLFX.links[obj.name]);
        WebGLFX.pause();
      } //if
    } //for
  }; //onCanvasClick
})();

// PLUGIN: webglfx 
(function (Popcorn) {
  /**
   * webglfx popcorn plug-in 
   */
  Popcorn.plugin( "webglfx" , {
    manifest: {
      about:{
        name: "Popcorn webglfx Plugin",
        version: "0.1",
        author: "@secretrobotron",
        website: "robothaus.org/secretrobotron"
      },
      options:{
        start    : {elem:'input', type:'text', label:'In'},
        end      : {elem:'input', type:'text', label:'Out'},
        target   : {elem:'input', type:'text', label:'Target'},
        effect   : {elem:'input', type:'text', label:'Effect'},
        text     : {elem:'input', type:'text', label:'Text'},
        offset   : {elem:'input', type:'number', label:'Offset'},
        link     : {elem:'input', type:'text', label:'Link'},
        image    : {elem:'input', type:'text', label:'Image'}
      }
    },
    _setup: function(options) {
      options.duration = options.end - options.start;
      options.listeners = [];
      var effect = options.effect;
      if (effect === 'flyUpText') {
        var planeMaterial = new CubicVR.Material({
          textures: {
            color: new CubicVR.TextTexture(options.text, {font:'bold 72pt Arial', align: 'right'})
          }
        });
        var planeMesh = CubicVR.primitives.plane({
          size: 1.0,
          material: planeMaterial,
          uvmapper: {
            projectionMode: CubicVR.enums.uv.projection.PLANAR,
            projectionAxis: CubicVR.enums.uv.axis.Z,
            scale: [-1, 1, 1]
          }
        });
        planeMesh.triangulateQuads().compile().clean();
        var textObj = new CubicVR.SceneObject(planeMesh);
        textObj.name = WebGLFX.uuid();
        options.obj = textObj;
      }
      else if (effect === 'rumbleText') {
        var planeMaterial = new CubicVR.Material({
          textures: {
            color: new CubicVR.TextTexture(options.text, {font:'bold 72pt Arial', align: 'right'})
          }
        });
        var planeMesh = CubicVR.primitives.plane({
          size: 1.0,
          material: planeMaterial,
          uvmapper: {
            projectionMode: CubicVR.enums.uv.projection.PLANAR,
            projectionAxis: CubicVR.enums.uv.axis.Z,
            scale: [-1, 1, 1]
          }
        });
        planeMesh.triangulateQuads().compile().clean();
        var textObj = new CubicVR.SceneObject(planeMesh);
        textObj.name = WebGLFX.uuid();
        options.obj = textObj;
      }
      else if (effect === 'imageWheel') {
        options.texture = new CubicVR.Texture(options.image);
      } //if
    },
    start: function(event, options){
      var sceneObject = WebGLFX.scene.getSceneObject(options.target);
      var effect = options.effect;
      if (sceneObject || options.target === '_new') {
        if (effect === 'visible') {
          sceneObject.visible = true;
        }
        else if (effect === 'zoomIn') {
          WebGLFX.animate(sceneObject, {
            prop: 'position', 
            timeStart: options.start,
            timeEnd: options.end,
            start: -100,
            end: 0,
            fn:function(obj, index, animation){
              obj.position[2] = index;
            }
          });
        }
        else if (effect === 'zoomOut') {
          WebGLFX.animate(sceneObject, {
            prop: 'position', 
            timeStart: options.start,
            timeEnd: options.end,
            start: 0,
            end: -100,
            fn:function(obj, index, animation){
              obj.position[2] = index;
            }
          });
        }
        else if (effect === 'imageWheel') {
          if (options.link === undefined) {
            WebGLFX.imageWheelItems = [];
          }
          else {
            var planeMaterial = new CubicVR.Material({textures: {color: options.texture}});
            var planeMesh = CubicVR.primitives.plane({
              size: 1.0,
              material: planeMaterial,
              uvmapper: {
                projectionMode: CubicVR.enums.uv.projection.PLANAR,
                projectionAxis: CubicVR.enums.uv.axis.Z,
                scale: [-1, 1, 1]
              }
            });
            planeMesh.triangulateQuads().compile().clean();
  
            var items = WebGLFX.imageWheelItems.length;
            var parent = new CubicVR.SceneObject(new CubicVR.Mesh());
            var child = new CubicVR.SceneObject(planeMesh);
            var angle = -40/180*Math.PI;
  
            parent.rotation[1] = -40;
            parent.rotation[0] = -30;
            parent.position = [-0.05-Math.sin(angle), 0, -1.2-Math.cos(angle)];
            child.position[2] += 1;
            parent.bindChild(child);
            WebGLFX.imageWheelItems.push(parent);
            parent.name = WebGLFX.uuid();
            child.name = WebGLFX.uuid();
            WebGLFX.scene.bindSceneObject(parent, true);
            WebGLFX.registerLink(parent, options.link);
  
            var randPos = [Math.random() * 10, Math.random() * 3, Math.random() * 10];
            WebGLFX.animate(child, {
              prop: 'rotation', 
              timeStart: options.start,
              timeEnd: options.start + 20,
              start: 0,
              end: 100,
              fn:function(obj, index, animation){
                obj.rotation[0] = randPos[0] + Math.sin(index/3)*3;
                obj.rotation[1] = randPos[1] + Math.cos(index/2)*3;
                obj.rotation[2] = randPos[2] + Math.sin(index/5)*3;
              }
            });
  
            var angle = -40/180*Math.PI;
            var ax = Math.sin(angle);
            var az = Math.cos(angle);
            for (var i=0, maxI = WebGLFX.imageWheelItems.length; i<maxI; ++i) {
              (function() {
                item = WebGLFX.imageWheelItems[i];
                var startPos = item.position.slice();
                WebGLFX.animate(item, {
                  prop: 'position', 
                  timeStart: options.start,
                  timeEnd: options.end,
                  start: 0,
                  end: 1.8,
                  fn:function(obj, index, animation){
                    obj.position[0] = startPos[0] + az*index;
                    obj.position[2] = startPos[2] - ax*index;
                  }
                });
                WebGLFX.animate(item, {
                  prop: 'rotation', 
                  timeStart: options.start,
                  timeEnd: options.end,
                  start: item.rotation[0],
                  end: item.rotation[0] + 30,
                  fn:function(obj, index, animation){
                    obj.rotation[0] = index;
                  }
                });
              })();
            } //for
          } //if
        }
        else if (effect === 'rumbleText') {
          var link = options.link;
          var textObj = options.obj;
          textObj.position = [.7, -3, 0.1];
          textObj.rotation[1] = -20;
          textObj.rotation[0] = 10;
          WebGLFX.scene.bindSceneObject(textObj, link);
          WebGLFX.animate(textObj, {
            prop: 'position',
            timeStart: options.start,
            timeEnd: options.end,
            start: -3,
            end: 4.5 + options.offset,
            fn: function(obj, index, animation){
              obj.position[1] = index;
              obj.position[2] = .7 + Math.sin(index*3000) * 0.01;
            }
          });
          if (link) {
            WebGLFX.registerLink(textObj, link);
          } //if
        }
        else if (effect === 'flyUpText') {
          var link = options.link;
          var textObj = options.obj;
          textObj.position = [1, -10, 0.1];
          textObj.rotation[1] = -20;
          WebGLFX.scene.bindSceneObject(textObj, link);
          if (link) {
          } //if
          WebGLFX.animate(textObj, {
            prop: 'rotation',
            timeStart: options.start,
            timeEnd: options.end + 1,
            start: textObj.rotation[1],
            end: textObj.rotation[1] - 40 + Math.random()*80,
            fn: function(obj, index, animation){
              obj.rotation[1] = index;
            }
          });
          WebGLFX.animate(textObj, {
            prop: 'position',
            timeStart: options.start,
            timeEnd: options.start + .4,
            start: textObj.position[1],
            end: 0 + options.offset,
            fn: function(obj, index, animation){
              obj.position[1] = index;
            }
          });
          if (link) {
            WebGLFX.registerLink(textObj, link);
          } //if
        }
        else if (effect === 'showSource') {
          WebGLFX.showSource();
        }
        else if (effect === 'moveOver') {
          WebGLFX.register(sceneObject, 'rotationY', 20);
          WebGLFX.animate(sceneObject, {
            prop: 'rotate',
            timeStart: options.start,
            timeEnd: options.end,
            start: sceneObject.rotation[1],
            end: 20,
            fn: function(obj, index, animation){
              obj.rotation[1] = index;
            }
          });
          WebGLFX.animate(sceneObject, {
            prop: 'position',
            timeStart: options.start,
            timeEnd: options.end,
            start: sceneObject.position[0],
            end: -1,
            fn: function(obj, index, animation){
              obj.position[0] = index;
            }
          });
        }
        else if (effect === 'moveBack') {
          WebGLFX.register(sceneObject, 'rotationY', 0);
          WebGLFX.animate(sceneObject, {
            prop: 'rotate',
            timeStart: options.start,
            timeEnd: options.end,
            start: sceneObject.rotation[1],
            end: 0,
            fn: function(obj, index, animation){
              obj.rotation[1] = index;
            }
          });
          WebGLFX.animate(sceneObject, {
            prop: 'position',
            timeStart: options.start,
            timeEnd: options.end,
            start: sceneObject.position[0],
            end: 0,
            fn: function(obj, index, animation){
              obj.position[0] = index;
            }
          });
        }
        else if (effect === 'perspective') {
          var fn = function(e) {
            if (e.keyCode !== 32 && e.keyCode !== 0) return;
            var sceneObject = WebGLFX.scene.getSceneObject(options.target);
            var effect = options.effect;
            WebGLFX.animate(sceneObject, {
              prop: 'rotation', 
              timeStart: WebGLFX.currentTime,
              timeEnd: WebGLFX.currentTime + .3,
              start: sceneObject.rotation[1],
              end: (sceneObject.rotation[1] + 180) % 360,
              fn:function(obj, index, animation){
                obj.rotation[1] = index;
              }
            });
          };
          options.listeners['keypress'] = fn;
          window.addEventListener('keypress', fn, false);
          $('#perspective-change-notification').fadeIn(2000);
        } //if
      } //if
    },
    end: function(event, options){
      var sceneObject = WebGLFX.scene.getSceneObject(options.target);
      var effect = options.effect;
      if (sceneObject || options.target === '_new') {
        if (effect === 'visible') {
          sceneObject.visible = false;
        }
        else if (effect === 'rumbleText') {
          //options.obj.visible = false;
        }
        else if (effect === 'flyUpText') {
          var textObj = options.obj;
          if (options.text) {
            WebGLFX.unregisterLink(textObj);
          } //if
          WebGLFX.animate(textObj, {
            prop: 'position',
            timeStart: options.end,
            timeEnd: options.end + .4,
            start: textObj.position[1],
            end: textObj.position[1] + 3,
            fn: function(obj, index, animation){
              obj.position[1] = index;
            }
          });
          WebGLFX.fire(textObj, {
            prop: 'visibility',
            time: options.end + .4,
            fn: function(obj, animation){
              obj.visible = false;
            }
          });
        }
        else if (effect === 'showSource') {
          WebGLFX.hideSource();
        }
        else if (effect === 'imageWheel') {
          if (options.link === undefined) {
            var angle = -40/180*Math.PI;
            var ax = Math.sin(angle);
            var az = Math.cos(angle);
            for (var i=0, maxI = WebGLFX.imageWheelItems.length; i<maxI; ++i) {
              (function() {
                item = WebGLFX.imageWheelItems[i];
                var startPos = item.position.slice();
                WebGLFX.animate(item, {
                  prop: 'position', 
                  timeStart: options.end,
                  timeEnd: options.end + 1,
                  start: 0,
                  end: 7,
                  fn:function(obj, index, animation) {
                    obj.position[0] = startPos[0] + az*index;
                    obj.position[2] = startPos[2] - ax*index;
                  }
                });
                WebGLFX.animate(item, {
                  prop: 'rotation', 
                  timeStart: options.end,
                  timeEnd: options.end + 1,
                  start: item.rotation[0],
                  end: item.rotation[0] + 30,
                  fn:function(obj, index, animation){
                    obj.rotation[0] = index;
                  }
                });
                WebGLFX.fire(item, {
                  prop: 'visibility',
                  time: options.end + 1,
                  fn: function(obj, animation){
                    obj.visible = false;
                    WebGLFX.unregisterLink(item);
                  }
                });
              })();
            } //for
          }
        }
        else if (effect === 'perspective') {
          var sceneObject = WebGLFX.scene.getSceneObject(options.target);
          var effect = options.effect;
          var end_rot = WebGLFX.check(sceneObject, 'rotationY') || 0;
          WebGLFX.animate(sceneObject, {
            prop: 'rotation', 
            timeStart: WebGLFX.currentTime,
            timeEnd: WebGLFX.currentTime + .3,
            start: sceneObject.rotation[1],
            end: end_rot,
            fn:function(obj, index, animation){
              obj.rotation[1] = index;
            }
          }, true);
          window.removeEventListener('keypress', options.listeners['keypress'], false);
          delete options.listeners['keypress'];
          $('#perspective-change-notification').fadeOut(2000);
        } //if
      } //if
    }
  });
})(Popcorn);
