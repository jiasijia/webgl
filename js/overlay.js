include('js/lib/clock.js');
include('js/lib/OrbitControls.js');

window.requestAnimationFrame = (function(){
return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
          window.setTimeout(callback, 1000 / 60);
        };
})();

var renderer, camera, stats, camera, light, controls, control, loader = new THREE.TextureLoader();
var w = window.innerWidth, h = window.innerHeight;
var controls;
var perScene, perCamera;
var orthoScene, orthoCamera;

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000);
  renderer.autoClear = false;
  renderer.shadowMapEnabled = true;
  document.body.appendChild(renderer.domElement);

  perScene = new THREE.Scene();
  perCamera = new THREE.PerspectiveCamera(60, w/h, 0.1, 10000);
  perCamera.position.set(350, 350, 350);
  perCamera.lookAt(perScene.position);

  light = new THREE.DirectionalLight();
  light.position.set(700, 400, -500);
  light.castShadow = true;
  //light.lookAt(perScene.position);
  light.shadowCameraNear = 250;
  light.shadowCameraFar = 2000;
  light.shadowCameraLeft = -500;
  light.shadowCameraRight = 500;
  light.shadowCameraTop = 500;
  light.shadowCameraBottom = -500;
  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;
  light.shadowCameraVisible = true;
  light.name ='dlight';
  perScene.add(light);
  perScene.add(new THREE.AxisHelper(500));

  var sphere = new THREE.SphereGeometry(30, 10, 10);
  var sphereMesh = new THREE.Mesh(sphere, new THREE.MeshPhongMaterial({
    //map: loader.load('img/t3.jpg'),
    refractionRatio: 0.98,
  }))  
  sphereMesh.name = 'sphere';
  sphereMesh.position.set(100, 30, 0);
  sphereMesh.material.refractionRatio = 0.98;
  sphereMesh.castShadow = true;
  perScene.add(sphereMesh);

  /*2d元素*/
  //overlay2d();
  /*纹理地板*/
  addFloor()
  /*用动态的canvas做纹理*/
  canvasTexture();
  /*用video做动态纹理*/
  //videoTexture();
  /*多种材质*/
  multiMaterial();
  /*反射*/
  //cubeMap();
  initControls();
  render();
  
}


function overlay2d() {
  orthoScene = new THREE.Scene();
  orthoCamera = new THREE.OrthographicCamera(w/-2, w/2, h/2, h/-2, 0, 5000);
  orthoCamera.position.set(0, 0, 0);

  var spriteMaterial = new THREE.SpriteMaterial({
    map: loader.load('img/36.jpg'),
  });
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(w/-3,h/3,0);
  sprite.scale.set(w/3,h/4);
  orthoScene.add(sprite);
}

function multiMaterial() {
  var g = new THREE.CylinderGeometry(10, 20, 50, 10);
  var materialL = new THREE.MeshLambertMaterial({
    color: 'purple',
    transparent: true,
    opacity: 0.5,
  });
  var materialP = new THREE.MeshLambertMaterial({
    wireframe: true,
    color: 'green',
  })
  var mesh = new THREE.SceneUtils.createMultiMaterialObject(g, [materialL, materialP]);
  //var mesh = new THREE.Mesh(g, new THREE.MultiMaterial([materialL, materialP]));
  mesh.position.set(-50, 50, 0);
  perScene.add(mesh);

  var s = new THREE.SphereGeometry(50, 10, 10);
  var materials = [];
  var count = 0;
  s.faces.forEach(function(f) {
    f.materialIndex = count++;
    var m = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
    });
    if (count % 2 == 0) {
      m.transparent = true;
      m.opacity = 0.4;
    }
    m.side = THREE.DoubleSide;
    materials.push(m);
  })
  var sm = new THREE.Mesh(s, new THREE.MultiMaterial(materials));
  sm.position.set(-100, 100, 100);
  sm.name = 'separateMaterialMesh';
  perScene.add(sm);
}

function cubeMap() {
  var path = 'earth';
  var urls = [
    'img/' + path + '/px.jpg',
    'img/' + path + '/nx.jpg',
    'img/' + path + '/py.jpg',
    'img/' + path + '/ny.jpg',
    'img/' + path + '/pz.jpg',
    'img/' + path + '/nz.jpg'
  ];
  var cubeLoader = new THREE.CubeTextureLoader();
  var cubeMap = new THREE.CubeTextureLoader().load(urls);

  perScene.getObjectByName('sphere').material.envMap = cubeMap;

}

function canvasTexture() {
  var canvas = document.createElement('canvas');
  clock(canvas);
  canvas.width = 512
  canvas.height = 512;
  

  var canvasMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100),
    new THREE.MeshPhongMaterial({
      map: new THREE.Texture(canvas),
      //specular: 0xfffff,
    })
  );
  canvasMesh.castShadow = true;
  canvasMesh.position.set(-100, 100, -100);
  canvasMesh.rotation.y = - Math.PI / 4;
  canvasMesh.name = 'canvasMesh';
  perScene.add(canvasMesh);
}

function videoTexture() {
  var video = document.getElementById('video');
  videoTexture = new THREE.Texture(video);

  var videoMesh = new THREE.Mesh(new THREE.CubeGeometry(100, 60, 2),
    new THREE.MeshLambertMaterial({
      map: videoTexture,
    })
  )
  videoMesh.name = 'videoMesh';
  videoMesh.position.set(50, 50, 100);
  videoMesh.rotation.set(-Math.PI/3, Math.PI/8, 0);
  perScene.add(videoMesh);

}

function include(path) {
  var a=document.createElement("script");
  a.type = "text/javascript"; 
  a.src=path; 
  var head=document.getElementsByTagName("head")[0];
  head.appendChild(a);
}

function addFloor() {
  var slight = new THREE.SpotLight();
  slight.position.set(0, 500, 0);
  //perScene.add(slight);

  var floorGeometry = new THREE.PlaneGeometry(800, 800, 40, 40);
  var floorMaterial = new THREE.MeshPhongMaterial({
    //bumpScale: 0,
    //transparent: true,
    //opacity: 1,
  });
  /*normalMap 法向贴图*/
  floorMaterial.map = loader.load('img/t1.jpg');
  floorMaterial.map.wrapS = floorMaterial.map.wrapT = THREE.RepeatWrapping;
  floorMaterial.map.repeat.set(8, 8);

  var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.receiveShadow = true;
  floorMesh.receiveShadow = true;
  floorMesh.rotation.x = -Math.PI/2;
  perScene.add(floorMesh);
}

function initControls() {
  control = new THREE.OrbitControls(perCamera, renderer.domElement);
}

var theta = 0;
var gama = 0;
var rv = 0.04;
function render() {
  var s = perScene.getObjectByName('sphere');
  var dl = perScene.getObjectByName('dlight');
  theta += rv;
  gama += 0.02

  s.position.x = 100 * Math.cos(theta);
  s.position.y = 25 + 50 * Math.sin(theta);

  dl.position.x = 700 * Math.cos(gama);
  dl.position.z = 700 * Math.sin(gama);
  if (theta > Math.PI || theta < 0) {
    rv = -rv;
  }

  perScene.getObjectByName('canvasMesh').material.map.needsUpdate = true;
  //perScene.getObjectByName('videoMesh').material.map.needsUpdate = true;
  perScene.getObjectByName('separateMaterialMesh').rotation.x +=0.01;

  //perCamera.lookAt(s.position);
  //renderer.clear();
  renderer.render(perScene, perCamera);
  //renderer.clearDepth();
  //renderer.render(orthoScene, orthoCamera);

  requestAnimationFrame(render);
}

window.onload = init;
window.addEventListener('resize', function() {
  perCamera.aspect = window.innerWidth / window.innerHeight;
  perCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false)