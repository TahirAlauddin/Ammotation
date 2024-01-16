// Variables declaration
let previewShape;
let extensionIsToggled = true;
let shapes = []; // Array to store drawn shapes
let isCreating = false;
let shapeType = null; // Type of shape being created ('circle' or 'rectangle')
let startPoint = null;
let shapesColor = 'tomato';
let capturedImages = [];
let cropDimensions = [];
let croppedImgDiv, pageSSImage;
let isBlurred = false;
let pageScreenshot = null; // Variable to store the screenshot
let width = window.screen.width;
let height = window.screen.height;
let shapesHistory = []


function createCanvas() {  
  let canvas = document.createElement('canvas');
  // Adjust the temporary canvas size to match the capture area
  canvas.width = document.documentElement.scrollWidth
  canvas.height = document.documentElement.scrollHeight 
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = 10.1e4; // Ensure canvas is above everything
  canvas.style.pointerEvents = 'none'; // Allow clicking through the canvas
  document.body.appendChild(canvas)

  return canvas;
}

function cropImage(image, dimensions) {
  const tmpCanvas = document.createElement('canvas');
  const ctx = tmpCanvas.getContext('2d', {'willReadFrequently': true});
  
  // Set canvas size to match crop dimensions
  tmpCanvas.width = dimensions.width;
  tmpCanvas.height = dimensions.height;

  if (dimensions.type === 'circle') {
      // Create an oval clipping path
      ctx.beginPath();
      ctx.ellipse(dimensions.width / 2, dimensions.height / 2,
      dimensions.width / 2, dimensions.height / 2,
      0, 0, 2 * Math.PI);
      ctx.clip();
  } else if (dimensions.type === 'triangle') {
      ctx.beginPath();
      ctx.ellipse(dimensions.width / 2, dimensions.height / 2,
      dimensions.width / 2, dimensions.height / 2,
      0, 0, 2 * Math.PI);
      ctx.clip();
  }

  // Draw the cropped area of the original image onto the canvas
  ctx.drawImage(image, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 
  0, 0, dimensions.width, dimensions.height);
  
  // Extract the cropped image data from the canvas and create a new image element
  const croppedImage = new Image();
  croppedImage.src = tmpCanvas.toDataURL();
  croppedImage.style.position = 'absolute'
  croppedImage.style.left = dimensions.x + 'px';
  croppedImage.style.top = dimensions.y + 'px';
  croppedImage.alt = 'Cropped Image';
  croppedImage.style.zIndex = 1.1e5;
  
  // Append the new image element to the DOM
  croppedImgDiv.appendChild(croppedImage)
}


function createArrow(fromx, fromy, tox, toy) {
  let width = Math.abs(fromx - tox);
  let height = Math.abs(fromy - toy);
  if (width < 10 || height < 10) {
    return null
  }

  let canvas = createCanvas();
  const ctx = canvas.getContext('2d',  {'willReadFrequently': true});
  ctx.strokeStyle = shapesColor; // Replace shapesColor with your color variable
  ctx.lineWidth = 5;
  ctx.beginPath();
  let headlen = 20; // length of head in pixels
  let dx = tox - fromx;
  let dy = toy - fromy;
  let angle = Math.atan2(dy, dx);
  
  // Start drawing the main line
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  // Calculate the offset starting point for the arrowhead
  let offset = 1; // Distance you want to move the head back by
  let arrowBaseX = tox - offset * Math.cos(angle);
  let arrowBaseY = toy - offset * Math.sin(angle);
  
  // Draw the lines for the arrowhead starting from the new offset position
  ctx.moveTo(arrowBaseX, arrowBaseY);
  ctx.lineTo(arrowBaseX - headlen * Math.cos(angle - Math.PI / 6), arrowBaseY - headlen * Math.sin(angle - Math.PI / 6));
  
  ctx.moveTo(arrowBaseX, arrowBaseY);
  ctx.lineTo(arrowBaseX - headlen * Math.cos(angle + Math.PI / 6), arrowBaseY - headlen * Math.sin(angle + Math.PI / 6));
  
  // Apply the stroke to the path
  ctx.stroke();
  

  return canvas;
}

function drawShape(type, x, y, width, height) {
  
  const shapeDiv = document.createElement('div');
  shapeDiv.style.position = 'absolute';
  shapeDiv.style.left = `${x}px`;
  shapeDiv.style.top = `${y}px`;
  shapeDiv.style.zIndex = 10e4
  shapeDiv.style.borderWidth = '5px'

  if (type === 'circle') {
    shapeDiv.style.width = `${width}px`;
    shapeDiv.style.height = `${height}px`; // Make height equal to width for a circle
    shapeDiv.style.borderRadius = '50%';
  } else if (type === 'rectangle') {
    shapeDiv.style.width = `${width}px`;
    shapeDiv.style.height = `${height}px`;
    shapeDiv.style.borderRadius = `8px`
  }  else if (type === 'triangle') {
    shapeDiv.style = `border-left: 50px solid ${shapesColor}; border-right: 50px solid ${shapesColor}; border-bottom: 100px solid ${shapesColor}` 
    shapeDiv.style.width = `${width}px`;
    shapeDiv.style.height = `${height}px`;
  }

  return shapeDiv
}

// Utility function to create a shape
function createShape(type, x, y, width, height) {
  
  if (width < 10 || height < 10) {
    return null;
  }

  const shapeDiv = drawShape(type, x, y, width, height) 

  //? Keep adding images to the dimensions list, for later cropping
  cropDimensions.push(
    { x: x-10, y: y, width: width+10, height: height+10, type: type }
  )
  
  shapeDiv.style.backgroundColor = 'transparent';
  shapeDiv.style.border = "5px solid " + shapesColor || 'lightblue'; // Use global color or default
  shapeDiv.classList.add('shape');
  document.body.appendChild(shapeDiv);
  shapes.push(shapeDiv);
  return shapeDiv;
}

// Function to handle the start of shape creation
function startCreatingShape(e) {
  if (!shapeType) return; // Exit if no shape type is selected

  isCreating = true;
  startPoint = { x: e.pageX, y: e.pageY };
}


function moveShape(e) {
  
  if (isCreating && startPoint) {
    
    const [adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight] = getDimensions(e); 
    drawShapePreview(e, adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);

  }

}

function drawShapePreview(e, adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight) {
  
  if (previewShape) {
    previewShape.remove()
    previewShape = null
  }
  if (shapeType === 'circle' || shapeType === 'rectangle') {
      previewShape = drawShape(shapeType, adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight)
      previewShape.style.border = "5px solid " + shapesColor || 'lightblue'; // Use global color or default
  }
  else if (shapeType === 'triangle')
    previewShape = createTriangle(adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);
  else if (shapeType == 'textbox') 
    previewShape = createTextBox(adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);
  else if (shapeType === 'arrow') 
    previewShape = createArrow(startPoint.x, startPoint.y, e.pageX, e.pageY);

  if (previewShape) {
    previewShape.style.backgroundColor = 'transparent';
    previewShape.classList.add('shape');
    document.body.appendChild(previewShape)
  }
}

function getDimensions(e) {
  const width = e.pageX - startPoint.x;
  const height = e.pageY - startPoint.y;

  // Adjust dimensions for positive values and correct positioning
  const adjustedStartX = width < 0 ? e.pageX : startPoint.x;
  const adjustedStartY = height < 0 ? e.pageY : startPoint.y;
  const adjustedWidth = Math.abs(width);
  const adjustedHeight = Math.abs(height);

  return [adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight]
}

// Modified stopCreatingShape function to include triangle creation
function stopCreatingShape(e) {
    if (!isCreating || !startPoint) return;
  
    if (previewShape) {
      previewShape.remove()
      previewShape = null
    }

  
    let shape;    
    const [adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight] = getDimensions(e);
  
    if (shapeType === 'circle' || shapeType === 'rectangle') {
      shape = createShape(shapeType, adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);
    } else if (shapeType === 'triangle') {
      shape = createTriangle(adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);
    } else if (shapeType == 'textbox') {
      shape = createTextBox(adjustedStartX, adjustedStartY, adjustedWidth, adjustedHeight);
    } else if (shapeType === 'arrow') {
      shape = createArrow(startPoint.x, startPoint.y, e.pageX, e.pageY);
    }
    
    if (shape) {
      shapesHistory.push(shape)
    }
    // Reset state
    isCreating = false;
    startPoint = null;
  }
  
function keypresshandler(e) {

  if (e.key === 'c' || e.key === 'C') {
    if (shapeType === 'circle') {
      shapeType = null;
    } else {
      shapeType = 'circle';
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (shapeType === 'rectangle') {
      shapeType = null
    } else {
      shapeType = 'rectangle';
    }
  } else if (e.key === 't' || e.key === 'T') {
    if (shapeType === 'triangle') {
      shapeType = null
    } else {
      shapeType = 'triangle';
    }
  } else if (e.key === 'Escape') {
    resetAll()
  } else if (e.key === 'w' || e.key === 'W') {
    if (shapeType === 'textbox') {
      shapeType = null
    } else {
      shapeType = 'textbox'
    }
  } else if (e.key === 'b' || e.key === 'B') {

    if (!isBlurred) {

      // ? pre-requisite
      croppedImgDiv = document.createElement('div');
      croppedImgDiv.id = 'croppedImages'
      document.body.appendChild(croppedImgDiv) 
      
      html2canvas(document.body.parentElement, {
        scale: 1, // Increases the resolution of the screenshot
        backgroundColor: 'none',
        useCORS: true, // Attempts to load images with CORS enabled
        x: 10,
        y: 0, 
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,

      }).then(function(canvas) {

        // Convert the canvas to an image (data URL)
        pageScreenshot = canvas.toDataURL('image/png');
        
        // You can also append the canvas to the body to see the screenshot
        pageSSImage = document.createElement('img');
        pageSSImage.style.position = 'absolute';
        pageSSImage.style.top = '0px';
        pageSSImage.style.left = '0px';
        pageSSImage.style.zIndex = 10e4;
        pageSSImage.src = pageScreenshot;
        pageSSImage.id = 'page-screenshot-image-ammotation'
        document.body.appendChild(pageSSImage);
        pageSSImage.style.filter = 'blur(5px)'

        setTimeout(() => {
          cropDimensions.forEach(dimensions => {
            cropImage(pageSSImage, dimensions);
          })
        }, 100);
      });
      isBlurred = true;
      shapes.forEach((shape) => {
        shape.style.left = shape.style.left + 20;
        // shape.style.height = shape.style.height + 10;
      })
    } else {
      croppedImgDiv.remove()
      isBlurred = false;
      document.getElementById(
        'page-screenshot-image-ammotation').remove()
    }

  } else if (e.key === 'a' || e.key === 'A') {
    if (shapeType === 'arrow') {
      shapeType = null
    } else {
      shapeType = 'arrow'
    }
  } else if (e.key === 'Backspace') {

    let shape = shapesHistory.pop()
    console.log(shape)
    shape.remove()
  } 
}

if (extensionIsToggled) {
  
  // Execute the function to apply settings
  setupDocumentInteractivity();

  // Modified event listener for keydown to include triangle
  document.addEventListener('keydown', keypresshandler)
  // Example usage and event listeners
  document.addEventListener('mousedown', startCreatingShape);
  document.addEventListener('mousemove', moveShape);
  document.addEventListener('mouseup', stopCreatingShape);
}

// Function to create a triangle
function createTriangle(x, y, width, height) {
  
  if (width < 10 || height < 10) {
    return null;
  }  
    
  const shapeDiv = document.createElement('div');
    shapeDiv.style.position = 'absolute';
    shapeDiv.style.left = `${x}px`;
    shapeDiv.style.top = `${y}px`;
    shapeDiv.style.width = `0px`;
    shapeDiv.style.height = `0px`;
    shapeDiv.style.borderLeft = `${width / 2}px solid transparent`;
    shapeDiv.style.borderRight = `${width / 2}px solid transparent`;
    shapeDiv.style.borderBottom = `${height}px solid ${shapesColor || 'lightblue'}`; // Use global color or default
    shapeDiv.style.zIndex = 10.1e4;
    shapeDiv.classList.add('shape');
    document.body.appendChild(shapeDiv);
    shapes.push(shapeDiv);
    return shapeDiv;
}  

  
function createTextBox(x, y, width, height) {
    // Create an input element
    if (width < 10 || height < 10) {
      return null
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'canvas-input'; // Assign class for styling
    input.style.position = 'absolute'
    input.style.left = x + 'px';
    input.style.top = y + 'px';
    input.style.width = width + 'px';
    input.style.height = height + 'px';
    input.style.fontSize = '18px';
    input.style.fontFamily = 'sans-serif';
    input.style.color = shapesColor;
    input.style.padding = '8px';
    input.style.border = `5px solid ${shapesColor}`;
    input.style.borderRadius = '5px';
    input.placeholder = 'Enter message here...';
    input.style.zIndex = 10.1e4
    input.style.outline = 'none'

    // Append the input to the body or a specific container
    document.body.appendChild(input);
    return input
}


function setupDocumentInteractivity() {
    // Create and append a style element to the document head for CSS rules
    const style = document.createElement('style');
    document.head.appendChild(style);
    // Insert CSS rules to prevent user selection
    style.sheet.insertRule(`* {
        -webkit-user-select: none; /* Chrome, Safari, Opera */
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* Internet Explorer */
        user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
    }`, 0);

    
    // Recursively make elements unselectable
    function makeUnselectable(node) {
        if (node.nodeType == 1) { // Check if the node is an element (1 = Element node)
            node.setAttribute("unselectable", "on");
        }
        let child = node.firstChild;
        while (child) {
            makeUnselectable(child);
            child = child.nextSibling;
        }
    }

    // Apply unselectable attribute to the document body and its children
    makeUnselectable(document.body);

}

function resetAll() {
  shapesHistory.forEach((shape) =>
    shape.remove())
  shapesHistory = [];
}

// Listen for messages
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

    if (message.action === 'enableExtension') {
      if ( message.enableExtension && !extensionIsToggled) {
        // Modified event listener for keydown to include triangle
        document.addEventListener('keydown', keypresshandler)
        // Example usage and event listeners
        document.addEventListener('mousedown', startCreatingShape);
        document.addEventListener('mouseup', stopCreatingShape);
        extensionIsToggled = true;
        setupDocumentInteractivity()
      } else {
        document.removeEventListener('keydown', this)
        document.removeEventListener('mousedown', this)
        document.removeEventListener('mouseup', this)
        extensionIsToggled = false;
        style.sheet.deleteRule(0);
      } 
    } else if (message.action === "changeColor") {
        // Validate the color value before applying
        console.log('Change color plz')
        if (/^#[0-9A-F]{6}$/i.test(message.color) || /^[a-zA-Z]+$/.test(message.color)) {
            // Apply the color to elements in the page
            shapesColor = message.color
            console.log('Color changed to', message.color);
            sendResponse({status: "Color changed to " + message.color});
          } else {
            console.log('Invalid color received:', message.color);
            sendResponse({status: "Invalid color value"});
        }
    }
});
