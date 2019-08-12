'use strict';
let image = new Image();
let dw, dh;
let objs = [];
let objsConvas = [];
let colors = ['red', 'blue'];
let IMG_SIZE = 224;

// This code is highly influenced from:
// 1. https://codepen.io/doughensel/pen/zGMmop
// 2. https://jsfiddle.net/richardcwc/ukqhf54k/
//
/**
// ||||||||||||||||||||||||||||||| \\
//	Global Object $: Generic controls
// ||||||||||||||||||||||||||||||| \\
**/
(function(){
	// http://stackoverflow.com/questions/4083351/what-does-jquery-fn-mean
	var $ = function( elem ){
		if (!(this instanceof $)){
      return new $(elem);
		}
		this.el = document.getElementById( elem );
	};
	window.$ = $;
	$.prototype = {
		onChange : function( callback ){
			this.el.addEventListener('change', callback );
			return this;
		}
	};
})();

/**
// ||||||||||||||||||||||||||||||| \\
//	Drag and Drop code for Upload
// ||||||||||||||||||||||||||||||| \\
**/
var dragdrop = {
	init : function( elem ){
		elem.setAttribute('ondrop', 'dragdrop.drop(event)');
		elem.setAttribute('ondragover', 'dragdrop.drag(event)' );
	},
	drop : function(e){
		e.preventDefault();
		var file = e.dataTransfer.files[0];
		runUpload( file );
	},
	drag : function(e){
		e.preventDefault();
	}
};

/**
// ||||||||||||||||||||||||||||||| \\
//	Code to capture a file (image)
//  and upload it to the browser
// ||||||||||||||||||||||||||||||| \\
**/
function runUpload( file ) {
	// http://stackoverflow.com/questions/12570834/how-to-preview-image-get-file-size-image-height-and-width-before-upload
	if( file.type === 'image/png'  ||
			file.type === 'image/jpg'  ||
		  file.type === 'image/jpeg' ||
			file.type === 'image/gif'  ||
			file.type === 'image/bmp'  ){
		var reader = new FileReader();//,
		//		image = new Image();
		reader.readAsDataURL( file );
		reader.onload = function( _file ){
			image.src = _file.target.result;
			image.onload = function() {
				//$('goto_select_btn').el.style.display = "block";
				next_page();
				$('canvas').el.parentElement.style.display = "block";
				//$('userImage').el.style.display = "none";

				let ratio = IMG_SIZE / image.width; // Math.min(image.width, image.height);
				dw = image.width * ratio;
				dh = image.height * ratio;

				// reset the size of the
				$('canvas').el.width = dw;
				$('canvas').el.height = dh;
				objsConvas = [$('canvas1').el, $('canvas2').el];


				let ctx = $('canvas').el.getContext('2d');
				ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dw, dh);

				//Variables
				let canvasx = $('canvas').el.getBoundingClientRect().left;
				let canvasy = $('canvas').el.getBoundingClientRect().top;
				let last_mousex = 0;
				let last_mousey = 0;
				let mousex = 0;
				let mousey = 0;
				let mousedown = false;

				//console.log('current', [mousex, mousey])
				//console.log('last', [last_mousex, last_mousey])
				//console.log('mousedown', mousedown)
				//console.log('canvas', [canvasx, canvasy])

				//Mousedown
				$('canvas').el.addEventListener('mousedown', function(e) {
					last_mousex = parseInt(e.clientX-canvasx);
					last_mousey = parseInt(e.clientY-canvasy);
					mousedown = true;
				}, false);

				//Mouseup
				$('canvas').el.addEventListener('mouseup', function(e) {
					let width = mousex-last_mousex;
					let height = mousey-last_mousey;

					if (objs.length >= 2) {
						objs = [];
						objsConvas.forEach(function(el){
							 el.parentElement.style.display = "none";
						})
						$('generate_btn').el.style.display = "none";
					}
					objs.push([last_mousex,last_mousey,width,height]);
					//Variables
					mousedown = false;
					refreshConvas(image, objs);
					if (objs.length == 2) {
						$('generate_btn').el.style.display = "inlinr-block";
						let ctx0 = $('canvas0').el.getContext('2d');
						ctx0.drawImage(image, 0, 0, image.width, image.height, 0, 0, IMG_SIZE, IMG_SIZE);
						refreshConvas(image, objs, 'canvasx');
					}
				}, false);

				//Mousemove
				$('canvas').el.addEventListener("mousemove", function(e) {
					mousex = parseInt(e.clientX-canvasx);
					mousey = parseInt(e.clientY-canvasy);
					if(mousedown) {
							ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
							ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dw, dh);
							ctx.beginPath();
							let width = mousex-last_mousex;
							let height = mousey-last_mousey;
							ctx.rect(last_mousex,last_mousey,width,height);
							ctx.strokeStyle = 'black';
							ctx.lineWidth = 10;
							ctx.stroke();
					}
				}, false);
			}



		} // END reader.onload()
	} // END test if file.type === image
}

/**
// ||||||||||||||||||||||||||||||| \\
//	window.onload fun
// ||||||||||||||||||||||||||||||| \\
**/
window.onload = function(){
	if( window.FileReader ){
		// Connect the DIV surrounding the file upload to HTML5 drag and drop calls
		dragdrop.init( $('userImage').el );
		//	Bind the input[type="file"] to the function runUpload()
		$('fileUpload').onChange(function(){
			runUpload( this.files[0] );
		});
		// Pagination
		let nextButtons = document.getElementsByClassName('next_page_btn');
		let backButtons = document.getElementsByClassName('back_page_btn');
		for(let i = 0; i < nextButtons.length; i++) {
			nextButtons[i].addEventListener('click', next_page );
		};

		for(let i = 0; i < backButtons.length; i++) {
			backButtons[i].addEventListener('click', prev_page );
		};

	} else {
		// Report error message if FileReader is unavilable
		var p   = document.createElement( 'p' ),
				msg = document.createTextNode( 'Sorry, your browser does not support FileReader.' );
		p.className = 'error';
		p.appendChild( msg );
		$('userImage').el.innerHTML = '';
		$('userImage').el.appendChild( p );
	}
};

function refreshConvas(image, bboxes, target='canvas') {
		let ctx = $(target).el.getContext('2d');
		// reset the size of the
		$(target).el.width = dw;
		$(target).el.height = dh;
		let ratio = image.width / dw;
		ctx.clearRect(0,0,$(target).el.width,$(target).el.height); //clear canvas
		ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dw, dh);
		objs.forEach(function(bbox, index) {
		  let x = bbox[0], y = bbox[1], w = bbox[2], h = bbox[3];
			objsConvas[index].parentElement.style.display = "block";
			objsConvas[index].parentElement.parentElement.style.display = "block";
			objsConvas[index].getContext('2d').drawImage(image, x * ratio, y * ratio, w * ratio, h * ratio, 0, 0, objsConvas[index].width, objsConvas[index].height);
			ctx.beginPath();
			ctx.rect(x,y,w,h);
			ctx.strokeStyle = colors[index];
			ctx.lineWidth = 3;
			ctx.stroke();
		});
}
