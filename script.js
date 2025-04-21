document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const canvas = document.getElementById('blueprint-canvas');
    const ctx = canvas.getContext('2d');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const gridSnapCheckbox = document.getElementById('grid-snap');
    const gridSizeDisplay = document.getElementById('grid-size-display');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const exportBtn = document.getElementById('export-btn');
    const clearBtn = document.getElementById('clear-btn');
    const propertiesContent = document.getElementById('properties-content');
    
    // Crear elementos adicionales para la interfaz mejorada
    const sidebarElement = document.querySelector('.sidebar');
    
    // Añadir campo para nombre del blueprint
    const blueprintNameInput = document.createElement('div');
    blueprintNameInput.className = 'blueprint-name-input';
    blueprintNameInput.innerHTML = `
        <h3>Nombre del Blueprint</h3>
        <input type="text" id="blueprint-name" placeholder="Mi Blueprint" value="Mi Blueprint">
    `;
    sidebarElement.insertBefore(blueprintNameInput, document.querySelector('.tools'));
    
    // Añadir selector de unidades
    const unitsSelector = document.createElement('div');
    unitsSelector.className = 'units-selector';
    unitsSelector.innerHTML = `
        <h3>Unidades</h3>
        <select id="units-select">
            <option value="pixels">Píxeles</option>
            <option value="meters">Metros</option>
            <option value="feet">Pies</option>
        </select>
        <div class="scale-input">
            <label>Escala (px por unidad):</label>
            <input type="number" id="scale-factor" value="40" min="1" max="100">
        </div>
    `;
    sidebarElement.insertBefore(unitsSelector, document.querySelector('.actions'));
    
    // Añadir selector de pisos
    const floorsSelector = document.createElement('div');
    floorsSelector.className = 'floors-selector';
    floorsSelector.innerHTML = `
        <h3>Pisos</h3>
        <div class="floors-controls">
            <button id="add-floor-btn">Añadir Piso</button>
            <select id="floor-select">
                <option value="0">Planta Baja</option>
            </select>
            <button id="delete-floor-btn">Eliminar Piso</button>
        </div>
    `;
    sidebarElement.insertBefore(floorsSelector, document.querySelector('.actions'));
    
    // Añadir botones de deshacer/rehacer
    const historyControls = document.createElement('div');
    historyControls.className = 'history-controls';
    historyControls.innerHTML = `
        <button id="undo-btn">Deshacer</button>
        <button id="redo-btn">Rehacer</button>
    `;
    document.querySelector('.canvas-controls').appendChild(historyControls);
    
    // Añadir botón de modo oscuro
    const darkModeToggle = document.createElement('button');
    darkModeToggle.id = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '🌙';
    darkModeToggle.title = 'Cambiar Modo';
    document.querySelector('.canvas-controls').appendChild(darkModeToggle);
    
    // Añadir herramienta de texto
    const textTool = document.createElement('button');
    textTool.id = 'text-tool';
    textTool.className = 'tool-btn';
    textTool.textContent = 'Texto';
    document.querySelector('.tools').appendChild(textTool);
    
    // Añadir biblioteca de muebles
    const furnitureLibrary = document.createElement('div');
    furnitureLibrary.className = 'furniture-library';
    furnitureLibrary.innerHTML = `
        <h3>Biblioteca de Muebles</h3>
        <div class="furniture-items">
            <div class="furniture-item" data-type="bed">🛏️ Cama</div>
            <div class="furniture-item" data-type="table">🪑 Mesa</div>
            <div class="furniture-item" data-type="sofa">🛋️ Sofá</div>
            <div class="furniture-item" data-type="kitchen">🍳 Cocina</div>
            <div class="furniture-item" data-type="bath">🛁 Baño</div>
            <div class="furniture-item" data-type="desk">💻 Escritorio</div>
            <div class="furniture-item" data-type="bookshelf">📚 Librero</div>
            <div class="furniture-item" data-type="wardrobe">👔 Armario</div>
            <div class="furniture-item" data-type="tv">📺 TV</div>
            <div class="furniture-item" data-type="plant">🌿 Planta</div>
        </div>
    `;
    sidebarElement.insertBefore(furnitureLibrary, document.querySelector('.actions'));
    
    // Configuración inicial
    let currentTool = 'wall';
    let elements = [];
    let isDrawing = false;
    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };
    let selectedElement = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let scale = 1;
    let gridSize = 20;
    let snapToGrid = true;
    
    // Nuevas variables para funcionalidades mejoradas
    let currentUnits = 'pixels';
    let scaleFactor = 40; // píxeles por unidad (metro o pie)
    let floors = [{ name: 'Planta Baja', elements: [] }];
    let currentFloor = 0;
    let history = []; // Para deshacer/rehacer
    let historyIndex = -1;
    let isDarkMode = false;
    let blueprintName = 'Mi Blueprint';
    let predefinedFurniture = {
        bed: { width: 200, height: 160, type: 'furniture' },
        table: { width: 120, height: 80, type: 'furniture' },
        sofa: { width: 240, height: 100, type: 'furniture' },
        kitchen: { width: 180, height: 60, type: 'furniture' },
        bath: { width: 160, height: 80, type: 'furniture' },
        desk: { width: 150, height: 75, type: 'furniture' },
        bookshelf: { width: 100, height: 200, type: 'furniture' },
        wardrobe: { width: 120, height: 220, type: 'furniture' },
        tv: { width: 120, height: 30, type: 'furniture' },
        plant: { width: 50, height: 50, type: 'furniture' }
    };
    
    // Inicializar elementos con el primer piso
    elements = floors[currentFloor].elements;
    
    // Ajustar tamaño del canvas
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawGrid();
        drawElements();
    }
    
    // Inicializar canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Cambiar herramienta activa
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentTool = this.id.replace('-tool', '');
            canvas.style.cursor = currentTool === 'select' ? 'pointer' : 'crosshair';
            selectedElement = null;
            updatePropertiesPanel();
        });
    });
    
    // Funciones de zoom
    zoomInBtn.addEventListener('click', function() {
        scale *= 1.1;
        drawGrid();
        drawElements();
    });
    
    zoomOutBtn.addEventListener('click', function() {
        scale *= 0.9;
        drawGrid();
        drawElements();
    });
    
    // Ajustar a cuadrícula
    gridSnapCheckbox.addEventListener('change', function() {
        snapToGrid = this.checked;
    });
    
    // Función para dibujar la cuadrícula
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);
        
        const scaledGridSize = gridSize;
        const width = canvas.width / scale;
        const height = canvas.height / scale;
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= width; x += scaledGridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += scaledGridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.restore();
        gridSizeDisplay.textContent = `Grid: ${gridSize}px`;
    }
    
    // Función para ajustar a la cuadrícula
    function snapToGridPoint(point) {
        if (snapToGrid) {
            return {
                x: Math.round(point.x / gridSize) * gridSize,
                y: Math.round(point.y / gridSize) * gridSize
            };
        }
        return point;
    }
    
    // Convertir coordenadas del mouse a coordenadas del canvas
    function getCanvasCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / scale,
            y: (event.clientY - rect.top) / scale
        };
    }
    
    // Dibujar todos los elementos
    function drawElements() {
        drawGrid();
        elements.forEach(element => drawElement(element));
    }
    
    // Dibujar un elemento individual
    function drawElement(element) {
        ctx.save();
        ctx.scale(scale, scale);
        
        switch (element.type) {
            case 'wall':
                ctx.beginPath();
                ctx.moveTo(element.start.x, element.start.y);
                ctx.lineTo(element.end.x, element.end.y);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#333';
                ctx.lineWidth = 5 / scale;
                ctx.stroke();
                break;
                
            case 'door':
                ctx.beginPath();
                ctx.moveTo(element.start.x, element.start.y);
                ctx.lineTo(element.end.x, element.end.y);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#e74c3c';
                ctx.lineWidth = 3 / scale;
                ctx.stroke();
                
                // Arco de la puerta
                const doorLength = Math.sqrt(
                    Math.pow(element.end.x - element.start.x, 2) +
                    Math.pow(element.end.y - element.start.y, 2)
                );
                const angle = Math.atan2(
                    element.end.y - element.start.y,
                    element.end.x - element.start.x
                );
                
                ctx.beginPath();
                ctx.arc(
                    element.start.x,
                    element.start.y,
                    doorLength,
                    angle - Math.PI/2,
                    angle,
                    false
                );
                ctx.stroke();
                break;
                
            case 'sliding-door':
                ctx.beginPath();
                ctx.moveTo(element.start.x, element.start.y);
                ctx.lineTo(element.end.x, element.end.y);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#e74c3c';
                ctx.lineWidth = 3 / scale;
                ctx.setLineDash([5, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Líneas paralelas para la puerta corrediza
                const sdx = element.end.x - element.start.x;
                const sdy = element.end.y - element.start.y;
                const slength = Math.sqrt(sdx*sdx + sdy*sdy);
                const snormalizedDx = sdx / slength;
                const snormalizedDy = sdy / slength;
                const sperpDx = -snormalizedDy * 3;
                const sperpDy = snormalizedDx * 3;
                
                ctx.beginPath();
                ctx.moveTo(element.start.x + sperpDx, element.start.y + sperpDy);
                ctx.lineTo(element.end.x + sperpDx, element.end.y + sperpDy);
                ctx.setLineDash([5, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
                
            case 'window':
                ctx.beginPath();
                ctx.moveTo(element.start.x, element.start.y);
                ctx.lineTo(element.end.x, element.end.y);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#3498db';
                ctx.lineWidth = 2 / scale;
                ctx.stroke();
                
                // Líneas paralelas para la ventana
                const dx = element.end.x - element.start.x;
                const dy = element.end.y - element.start.y;
                const length = Math.sqrt(dx*dx + dy*dy);
                const normalizedDx = dx / length;
                const normalizedDy = dy / length;
                const perpDx = -normalizedDy * 5;
                const perpDy = normalizedDx * 5;
                
                ctx.beginPath();
                ctx.moveTo(element.start.x + perpDx, element.start.y + perpDy);
                ctx.lineTo(element.end.x + perpDx, element.end.y + perpDy);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(element.start.x - perpDx, element.start.y - perpDy);
                ctx.lineTo(element.end.x - perpDx, element.end.y - perpDy);
                ctx.stroke();
                break;
                
            case 'skylight':
                ctx.beginPath();
                ctx.moveTo(element.start.x, element.start.y);
                ctx.lineTo(element.end.x, element.end.y);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#3498db';
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([2, 1]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Dibujar forma de tragaluz
                const skdx = element.end.x - element.start.x;
                const skdy = element.end.y - element.start.y;
                const sklength = Math.sqrt(skdx*skdx + skdy*skdy);
                const sknormalizedDx = skdx / sklength;
                const sknormalizedDy = skdy / sklength;
                const skperpDx = -sknormalizedDy * 8;
                const skperpDy = sknormalizedDx * 8;
                
                ctx.beginPath();
                ctx.moveTo(element.start.x + skperpDx, element.start.y + skperpDy);
                ctx.lineTo(element.end.x + skperpDx, element.end.y + skperpDy);
                ctx.lineTo(element.end.x - skperpDx, element.end.y - skperpDy);
                ctx.lineTo(element.start.x - skperpDx, element.start.y - skperpDy);
                ctx.closePath();
                ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'column':
                const colWidth = 20;
                const colHeight = 20;
                ctx.beginPath();
                ctx.arc(element.start.x, element.start.y, colWidth / 2 / scale, 0, Math.PI * 2);
                ctx.strokeStyle = element.selected ? '#f39c12' : '#8e44ad';
                ctx.fillStyle = 'rgba(142, 68, 173, 0.3)';
                ctx.lineWidth = 2 / scale;
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'stairs-up':
                ctx.beginPath();
                ctx.rect(
                    element.start.x,
                    element.start.y,
                    element.end.x - element.start.x,
                    element.end.y - element.start.y
                );
                ctx.strokeStyle = element.selected ? '#f39c12' : '#d35400';
                ctx.fillStyle = 'rgba(211, 84, 0, 0.3)';
                ctx.lineWidth = 2 / scale;
                ctx.fill();
                ctx.stroke();
                
                // Dibujar líneas de escalones
                const stairsWidth = element.end.x - element.start.x;
                const stairsHeight = element.end.y - element.start.y;
                const stepsCount = Math.max(3, Math.floor(Math.max(stairsWidth, stairsHeight) / 20));
                
                if (stairsWidth > stairsHeight) {
                    // Escaleras horizontales
                    const stepSize = stairsWidth / stepsCount;
                    for (let i = 1; i < stepsCount; i++) {
                        ctx.beginPath();
                        ctx.moveTo(element.start.x + i * stepSize, element.start.y);
                        ctx.lineTo(element.start.x + i * stepSize, element.end.y);
                        ctx.stroke();
                    }
                    
                    // Flecha de dirección
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + stairsWidth / 2, element.start.y + stairsHeight / 4);
                    ctx.lineTo(element.start.x + stairsWidth / 2, element.start.y + stairsHeight * 3/4);
                    ctx.lineTo(element.start.x + stairsWidth * 3/4, element.start.y + stairsHeight / 2);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Escaleras verticales
                    const stepSize = stairsHeight / stepsCount;
                    for (let i = 1; i < stepsCount; i++) {
                        ctx.beginPath();
                        ctx.moveTo(element.start.x, element.start.y + i * stepSize);
                        ctx.lineTo(element.end.x, element.start.y + i * stepSize);
                        ctx.stroke();
                    }
                    
                    // Flecha de dirección
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + stairsWidth / 4, element.start.y + stairsHeight / 2);
                    ctx.lineTo(element.start.x + stairsWidth * 3/4, element.start.y + stairsHeight / 2);
                    ctx.lineTo(element.start.x + stairsWidth / 2, element.start.y + stairsHeight / 4);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
                
            case 'stairs-down':
                ctx.beginPath();
                ctx.rect(
                    element.start.x,
                    element.start.y,
                    element.end.x - element.start.x,
                    element.end.y - element.start.y
                );
                ctx.strokeStyle = element.selected ? '#f39c12' : '#d35400';
                ctx.fillStyle = 'rgba(211, 84, 0, 0.2)';
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([4, 2]);
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Dibujar líneas de escalones
                const stairsDownWidth = element.end.x - element.start.x;
                const stairsDownHeight = element.end.y - element.start.y;
                const stepsDownCount = Math.max(3, Math.floor(Math.max(stairsDownWidth, stairsDownHeight) / 20));
                
                if (stairsDownWidth > stairsDownHeight) {
                    // Escaleras horizontales
                    const stepSize = stairsDownWidth / stepsDownCount;
                    for (let i = 1; i < stepsDownCount; i++) {
                        ctx.beginPath();
                        ctx.moveTo(element.start.x + i * stepSize, element.start.y);
                        ctx.lineTo(element.start.x + i * stepSize, element.end.y);
                        ctx.stroke();
                    }
                    
                    // Flecha de dirección
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + stairsDownWidth / 2, element.start.y + stairsDownHeight * 3/4);
                    ctx.lineTo(element.start.x + stairsDownWidth / 2, element.start.y + stairsDownHeight / 4);
                    ctx.lineTo(element.start.x + stairsDownWidth * 3/4, element.start.y + stairsDownHeight / 2);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Escaleras verticales
                    const stepSize = stairsDownHeight / stepsDownCount;
                    for (let i = 1; i < stepsDownCount; i++) {
                        ctx.beginPath();
                        ctx.moveTo(element.start.x, element.start.y + i * stepSize);
                        ctx.lineTo(element.end.x, element.start.y + i * stepSize);
                        ctx.stroke();
                    }
                    
                    // Flecha de dirección
                    ctx.beginPath();
                    ctx.moveTo(element.start.x + stairsDownWidth / 4, element.start.y + stairsDownHeight / 2);
                    ctx.lineTo(element.start.x + stairsDownWidth * 3/4, element.start.y + stairsDownHeight / 2);
                    ctx.lineTo(element.start.x + stairsDownWidth / 2, element.start.y + stairsDownHeight * 3/4);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
                
            case 'single-step':
                ctx.beginPath();
                ctx.rect(
                    element.start.x,
                    element.start.y,
                    element.end.x - element.start.x,
                    element.end.y - element.start.y
                );
                ctx.strokeStyle = element.selected ? '#f39c12' : '#d35400';
                ctx.fillStyle = 'rgba(211, 84, 0, 0.4)';
                ctx.lineWidth = 1 / scale;
                ctx.fill();
                ctx.stroke();
                
                // Línea de borde del escalón
                const stepWidth = element.end.x - element.start.x;
                const stepHeight = element.end.y - element.start.y;
                
                if (stepWidth > stepHeight) {
                    // Escalón horizontal
                    ctx.beginPath();
                    ctx.moveTo(element.start.x, element.start.y);
                    ctx.lineTo(element.end.x, element.start.y);
                    ctx.lineWidth = 2 / scale;
                    ctx.stroke();
                } else {
                    // Escalón vertical
                    ctx.beginPath();
                    ctx.moveTo(element.start.x, element.start.y);
                    ctx.lineTo(element.start.x, element.end.y);
                    ctx.lineWidth = 2 / scale;
                    ctx.stroke();
                }
                break;
                
            case 'ramp':
                ctx.beginPath();
                ctx.rect(
                    element.start.x,
                    element.start.y,
                    element.end.x - element.start.x,
                    element.end.y - element.start.y
                );
                ctx.strokeStyle = element.selected ? '#f39c12' : '#16a085';
                ctx.fillStyle = 'rgba(22, 160, 133, 0.2)';
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([8, 2]);
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Dibujar línea diagonal para la rampa
                const rampWidth = element.end.x - element.start.x;
                const rampHeight = element.end.y - element.start.y;
                
                ctx.beginPath();
                if (rampWidth > rampHeight) {
                    // Rampa horizontal
                    ctx.moveTo(element.start.x, element.end.y);
                    ctx.lineTo(element.end.x, element.start.y);
                } else {
                    // Rampa vertical
                    ctx.moveTo(element.start.x, element.start.y);
                    ctx.lineTo(element.end.x, element.end.y);
                }
                ctx.lineWidth = 2 / scale;
                ctx.stroke();
                break;
                
            case 'furniture':
                ctx.beginPath();
                ctx.rect(
                    element.start.x,
                    element.start.y,
                    element.end.x - element.start.x,
                    element.end.y - element.start.y
                );
                ctx.strokeStyle = element.selected ? '#f39c12' : '#2ecc71';
                ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
                ctx.lineWidth = 1 / scale;
                ctx.fill();
                ctx.stroke();
                
                // Dibujar ícono según tipo de mueble
                if (element.furnitureType) {
                    ctx.fillStyle = '#2c3e50';
                    ctx.font = `${16/scale}px Arial`;
                    const centerX = (element.start.x + element.end.x) / 2;
                    const centerY = (element.start.y + element.end.y) / 2;
                    
                    let icon = '🪑';
                    switch(element.furnitureType) {
                        case 'bed': icon = '🛏️'; break;
                        case 'table': icon = '🪑'; break;
                        case 'sofa': icon = '🛋️'; break;
                        case 'kitchen': icon = '🍳'; break;
                        case 'bath': icon = '🛁'; break;
                        case 'desk': icon = '💻'; break;
                        case 'bookshelf': icon = '📚'; break;
                        case 'wardrobe': icon = '👔'; break;
                        case 'tv': icon = '📺'; break;
                        case 'plant': icon = '🌿'; break;
                    }
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(icon, centerX, centerY);
                    
                    // Dibujar controles de redimensionamiento si está seleccionado
                    if (element.selected) {
                        const handleSize = 8 / scale;
                        
                        // Dibujar los 8 puntos de control
                        const handles = [
                            { x: element.start.x, y: element.start.y }, // Esquina superior izquierda
                            { x: (element.start.x + element.end.x) / 2, y: element.start.y }, // Centro superior
                            { x: element.end.x, y: element.start.y }, // Esquina superior derecha
                            { x: element.start.x, y: (element.start.y + element.end.y) / 2 }, // Centro izquierda
                            { x: element.end.x, y: (element.start.y + element.end.y) / 2 }, // Centro derecha
                            { x: element.start.x, y: element.end.y }, // Esquina inferior izquierda
                            { x: (element.start.x + element.end.x) / 2, y: element.end.y }, // Centro inferior
                            { x: element.end.x, y: element.end.y } // Esquina inferior derecha
                        ];
                        
                        ctx.fillStyle = '#f39c12';
                        handles.forEach(handle => {
                            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
                        });
                    }
                }
                break;
                
            case 'text':
                ctx.font = `${element.fontSize || 16/scale}px ${element.fontFamily || 'Arial'}`;
                ctx.fillStyle = element.selected ? '#f39c12' : (element.color || '#333');
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(element.text || 'Texto', element.start.x, element.start.y);
                
                // Dibujar borde de selección
                if (element.selected) {
                    const textWidth = ctx.measureText(element.text || 'Texto').width;
                    const textHeight = parseInt(element.fontSize || 16/scale);
                    
                    ctx.strokeStyle = '#f39c12';
                    ctx.lineWidth = 1 / scale;
                    ctx.strokeRect(
                        element.start.x - 2,
                        element.start.y - 2,
                        textWidth + 4,
                        textHeight + 4
                    );
                }
                break;
        }
        
        ctx.restore();
    }
    
    // Actualizar panel de propiedades
    function updatePropertiesPanel() {
        if (selectedElement) {
            let html = `<div class="property">
                <label>Tipo:</label>
                <span>${getElementTypeName(selectedElement.type)}</span>
            </div>`;
            
            if (selectedElement.type === 'wall' || selectedElement.type === 'door' || 
                selectedElement.type === 'sliding-door' || selectedElement.type === 'window' || 
                selectedElement.type === 'skylight') {
                const length = Math.sqrt(
                    Math.pow(selectedElement.end.x - selectedElement.start.x, 2) +
                    Math.pow(selectedElement.end.y - selectedElement.start.y, 2)
                );
                
                html += `<div class="property">
                    <label>Longitud:</label>
                    <span>${formatMeasurement(length)}</span>
                </div>`;
            } else if (selectedElement.type === 'furniture' || selectedElement.type === 'stairs-up' || 
                       selectedElement.type === 'stairs-down' || selectedElement.type === 'single-step' || 
                       selectedElement.type === 'ramp') {
                const width = Math.abs(selectedElement.end.x - selectedElement.start.x);
                const height = Math.abs(selectedElement.end.y - selectedElement.start.y);
                
                html += `<div class="property">
                    <label>Ancho:</label>
                    <span>${formatMeasurement(width)}</span>
                </div>
                <div class="property">
                    <label>Alto:</label>
                    <span>${formatMeasurement(height)}</span>
                </div>`;
                
                if (selectedElement.furnitureType) {
                    html += `<div class="property">
                        <label>Tipo de mueble:</label>
                        <span>${selectedElement.furnitureType}</span>
                    </div>`;
                }
            } else if (selectedElement.type === 'text') {
                html += `<div class="property">
                    <label>Texto:</label>
                    <input type="text" id="text-content" value="${selectedElement.text || 'Texto'}">
                </div>
                <div class="property">
                    <label>Tamaño:</label>
                    <input type="number" id="text-size" value="${Math.round(selectedElement.fontSize * scale || 16)}">
                </div>
                <div class="property">
                    <label>Color:</label>
                    <input type="color" id="text-color" value="${selectedElement.color || '#333333'}">
                </div>`;
            }
            
            html += `<button id="rotate-btn">Rotar</button>
                    <button id="delete-element-btn">Eliminar</button>`;
            
            propertiesContent.innerHTML = html;
            
            // Añadir eventos a los botones
            document.getElementById('rotate-btn').addEventListener('click', rotateSelectedElement);
            document.getElementById('delete-element-btn').addEventListener('click', deleteSelectedElement);
            
            // Añadir eventos para propiedades de texto
            if (selectedElement.type === 'text') {
                document.getElementById('text-content').addEventListener('change', function() {
                    selectedElement.text = this.value;
                    drawElements();
                    saveToHistory();
                });
                
                document.getElementById('text-size').addEventListener('change', function() {
                    selectedElement.fontSize = parseInt(this.value) / scale;
                    drawElements();
                    saveToHistory();
                });
                
                document.getElementById('text-color').addEventListener('change', function() {
                    selectedElement.color = this.value;
                    drawElements();
                    saveToHistory();
                });
            }
        } else {
            propertiesContent.innerHTML = '<p>Selecciona un elemento para ver sus propiedades</p>';
        }
    }
    
    // Función para obtener el nombre legible del tipo de elemento
    function getElementTypeName(type) {
        const typeNames = {
            'wall': 'Pared',
            'door': 'Puerta',
            'sliding-door': 'Puerta Corrediza',
            'window': 'Ventana',
            'skylight': 'Tragaluz',
            'column': 'Columna',
            'stairs-up': 'Escalera Ascendente',
            'stairs-down': 'Escalera Descendente',
            'single-step': 'Escalón',
            'ramp': 'Rampa',
            'furniture': 'Mueble',
            'text': 'Texto'
        };
        
        return typeNames[type] || type;
    }
    
    // Rotar elemento seleccionado
    function rotateSelectedElement() {
        if (selectedElement && selectedElement.type === 'furniture') {
            const centerX = (selectedElement.start.x + selectedElement.end.x) / 2;
            const centerY = (selectedElement.start.y + selectedElement.end.y) / 2;
            
            const width = selectedElement.end.x - selectedElement.start.x;
            const height = selectedElement.end.y - selectedElement.start.y;
            
            // Intercambiar ancho y alto
            selectedElement.start.x = centerX - height / 2;
            selectedElement.start.y = centerY - width / 2;
            selectedElement.end.x = centerX + height / 2;
            selectedElement.end.y = centerY + width / 2;
            
            drawElements();
            updatePropertiesPanel();
        }
    }
    
    // Eliminar elemento seleccionado
    function deleteSelectedElement() {
        if (selectedElement) {
            elements = elements.filter(el => el !== selectedElement);
            selectedElement = null;
            drawElements();
            updatePropertiesPanel();
        }
    }
    
    // Encontrar elemento en las coordenadas dadas
    function findElementAt(point) {
        // Buscar desde el último (superior) al primero (inferior)
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            
            switch (element.type) {
                case 'wall':
                case 'door':
                case 'sliding-door':
                case 'window':
                case 'skylight':
                    if (isPointNearLine(point, element.start, element.end, 10 / scale)) {
                        return element;
                    }
                    break;
                
                case 'column':
                    const colRadius = 10 / scale;
                    const distance = Math.sqrt(
                        Math.pow(point.x - element.start.x, 2) +
                        Math.pow(point.y - element.start.y, 2)
                    );
                    if (distance <= colRadius) {
                        return element;
                    }
                    break;
                    
                case 'furniture':
                case 'stairs-up':
                case 'stairs-down':
                case 'single-step':
                case 'ramp':
                    const minX = Math.min(element.start.x, element.end.x);
                    const maxX = Math.max(element.start.x, element.end.x);
                    const minY = Math.min(element.start.y, element.end.y);
                    const maxY = Math.max(element.start.y, element.end.y);
                    
                    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
                        return element;
                    }
                    break;
                    
                case 'text':
                    const ctx = canvas.getContext('2d');
                    ctx.font = `${element.fontSize || 16/scale}px ${element.fontFamily || 'Arial'}`;
                    const textWidth = ctx.measureText(element.text || 'Texto').width;
                    const textHeight = parseInt(element.fontSize || 16/scale);
                    
                    if (point.x >= element.start.x && 
                        point.x <= element.start.x + textWidth && 
                        point.y >= element.start.y && 
                        point.y <= element.start.y + textHeight) {
                        return element;
                    }
                    break;
            }
        }
        
        return null;
    }
    
    // Comprobar si un punto está cerca de una línea
    function isPointNearLine(point, lineStart, lineEnd, threshold) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        
        // Distancia del punto a la línea
        const distance = Math.abs(
            (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / length
        );
        
        // Comprobar si el punto está dentro del segmento de línea
        const dotProduct = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx*dx + dy*dy);
        
        return distance <= threshold && dotProduct >= 0 && dotProduct <= 1;
    }
    
    // Función para verificar si un punto está sobre un control de redimensionamiento
    function getResizeHandleAt(point, element) {
        if (!element || element.type !== 'furniture' || !element.selected) return null;
        
        const handleSize = 8 / scale;
        const handles = [
            { x: element.start.x, y: element.start.y, cursor: 'nwse-resize', position: 'topleft' },
            { x: (element.start.x + element.end.x) / 2, y: element.start.y, cursor: 'ns-resize', position: 'top' },
            { x: element.end.x, y: element.start.y, cursor: 'nesw-resize', position: 'topright' },
            { x: element.start.x, y: (element.start.y + element.end.y) / 2, cursor: 'ew-resize', position: 'left' },
            { x: element.end.x, y: (element.start.y + element.end.y) / 2, cursor: 'ew-resize', position: 'right' },
            { x: element.start.x, y: element.end.y, cursor: 'nesw-resize', position: 'bottomleft' },
            { x: (element.start.x + element.end.x) / 2, y: element.end.y, cursor: 'ns-resize', position: 'bottom' },
            { x: element.end.x, y: element.end.y, cursor: 'nwse-resize', position: 'bottomright' }
        ];
        
        for (const handle of handles) {
            if (Math.abs(point.x - handle.x) <= handleSize && Math.abs(point.y - handle.y) <= handleSize) {
                return handle;
            }
        }
        
        return null;
    }
    
    // Eventos del mouse
    canvas.addEventListener('mousedown', function(event) {
        const point = getCanvasCoordinates(event);
        const snappedPoint = snapToGridPoint(point);
        
        if (currentTool === 'select') {
            // Verificar si estamos sobre un control de redimensionamiento
            if (selectedElement && selectedElement.type === 'furniture') {
                const handle = getResizeHandleAt(point, selectedElement);
                if (handle) {
                    isResizing = true;
                    resizeHandle = handle.position;
                    return;
                }
            }
            
            const element = findElementAt(point);
            
            if (element) {
                selectedElement = element;
                element.selected = true;
                isDragging = true;
                
                if (element.type === 'furniture') {
                    dragOffset.x = point.x - element.start.x;
                    dragOffset.y = point.y - element.start.y;
                } else {
                    dragOffset.x = point.x - element.start.x;
                    dragOffset.y = point.y - element.start.y;
                }
            } else {
                if (selectedElement) {
                    selectedElement.selected = false;
                    selectedElement = null;
                }
            }
            
            updatePropertiesPanel();
        } else if (currentTool === 'delete') {
            const element = findElementAt(point);
            
            if (element) {
                elements = elements.filter(el => el !== element);
                saveToHistory();
            }
        } else if (currentTool === 'text') {
            // Crear un nuevo elemento de texto
            const textContent = prompt('Introduce el texto:', 'Texto');
            
            if (textContent) {
                const newText = {
                    type: 'text',
                    start: { x: snappedPoint.x, y: snappedPoint.y },
                    text: textContent,
                    fontSize: 16/scale,
                    fontFamily: 'Arial',
                    color: '#333',
                    selected: false
                };
                
                elements.push(newText);
                saveToHistory();
            }
        } else {
            isDrawing = true;
            startPoint = snappedPoint;
            endPoint = snappedPoint;
        }
        
        drawElements();
    });
    
    // Actualizar cursor según el control de redimensionamiento
    canvas.addEventListener('mousemove', function(event) {
        const point = getCanvasCoordinates(event);
        const snappedPoint = snapToGridPoint(point);
        
        // Cambiar el cursor si estamos sobre un control de redimensionamiento
        if (selectedElement && selectedElement.type === 'furniture' && currentTool === 'select') {
            const handle = getResizeHandleAt(point, selectedElement);
            if (handle) {
                canvas.style.cursor = handle.cursor;
                return;
            } else {
                canvas.style.cursor = 'pointer';
            }
        }
        
        if (isResizing && selectedElement && selectedElement.type === 'furniture') {
            // Redimensionar el mueble según el control que se está arrastrando
            switch (resizeHandle) {
                case 'topleft':
                    selectedElement.start.x = snappedPoint.x;
                    selectedElement.start.y = snappedPoint.y;
                    break;
                case 'top':
                    selectedElement.start.y = snappedPoint.y;
                    break;
                case 'topright':
                    selectedElement.end.x = snappedPoint.x;
                    selectedElement.start.y = snappedPoint.y;
                    break;
                case 'left':
                    selectedElement.start.x = snappedPoint.x;
                    break;
                case 'right':
                    selectedElement.end.x = snappedPoint.x;
                    break;
                case 'bottomleft':
                    selectedElement.start.x = snappedPoint.x;
                    selectedElement.end.y = snappedPoint.y;
                    break;
                case 'bottom':
                    selectedElement.end.y = snappedPoint.y;
                    break;
                case 'bottomright':
                    selectedElement.end.x = snappedPoint.x;
                    selectedElement.end.y = snappedPoint.y;
                    break;
            }
            
            // Asegurar que el ancho y alto sean positivos
            if (selectedElement.end.x < selectedElement.start.x) {
                const temp = selectedElement.start.x;
                selectedElement.start.x = selectedElement.end.x;
                selectedElement.end.x = temp;
                
                // Cambiar el control si es necesario
                if (resizeHandle === 'topleft') resizeHandle = 'topright';
                else if (resizeHandle === 'topright') resizeHandle = 'topleft';
                else if (resizeHandle === 'left') resizeHandle = 'right';
                else if (resizeHandle === 'right') resizeHandle = 'left';
                else if (resizeHandle === 'bottomleft') resizeHandle = 'bottomright';
                else if (resizeHandle === 'bottomright') resizeHandle = 'bottomleft';
            }
            
            if (selectedElement.end.y < selectedElement.start.y) {
                const temp = selectedElement.start.y;
                selectedElement.start.y = selectedElement.end.y;
                selectedElement.end.y = temp;
                
                // Cambiar el control si es necesario
                if (resizeHandle === 'topleft') resizeHandle = 'bottomleft';
                else if (resizeHandle === 'top') resizeHandle = 'bottom';
                else if (resizeHandle === 'topright') resizeHandle = 'bottomright';
                else if (resizeHandle === 'bottomleft') resizeHandle = 'topleft';
                else if (resizeHandle === 'bottom') resizeHandle = 'top';
                else if (resizeHandle === 'bottomright') resizeHandle = 'topright';
            }
            
            drawElements();
        } else if (isDragging && selectedElement) {
            if (selectedElement.type === 'furniture') {
                const width = selectedElement.end.x - selectedElement.start.x;
                const height = selectedElement.end.y - selectedElement.start.y;
                
                selectedElement.start.x = snappedPoint.x - dragOffset.x;
                selectedElement.start.y = snappedPoint.y - dragOffset.y;
                selectedElement.end.x = selectedElement.start.x + width;
                selectedElement.end.y = selectedElement.start.y + height;
            } else {
                const dx = selectedElement.end.x - selectedElement.start.x;
                const dy = selectedElement.end.y - selectedElement.start.y;
                
                selectedElement.start.x = snappedPoint.x - dragOffset.x;
                selectedElement.start.y = snappedPoint.y - dragOffset.y;
                selectedElement.end.x = selectedElement.start.x + dx;
                selectedElement.end.y = selectedElement.start.y + dy;
            }
            
            drawElements();
        } else if (isDrawing) {
            endPoint = snappedPoint;
            drawElements();
            
            // Dibujar elemento temporal
            ctx.save();
            ctx.scale(scale, scale);
            
            switch (currentTool) {
                case 'wall':
                    ctx.beginPath();
                    ctx.moveTo(startPoint.x, startPoint.y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 5 / scale;
                    ctx.stroke();
                    break;
                    
                case 'door':
                    ctx.beginPath();
                    ctx.moveTo(startPoint.x, startPoint.y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 3 / scale;
                    ctx.stroke();
                    break;
                    
                case 'window':
                    ctx.beginPath();
                    ctx.moveTo(startPoint.x, startPoint.y);
                    ctx.lineTo(endPoint.x, endPoint.y);
                    ctx.strokeStyle = '#3498db';
                    ctx.lineWidth = 2 / scale;
                    ctx.stroke();
                    break;
                    
                case 'furniture':
                    ctx.beginPath();
                    ctx.rect(
                        startPoint.x,
                        startPoint.y,
                        endPoint.x - startPoint.x,
                        endPoint.y - startPoint.y
                    );
                    ctx.strokeStyle = '#2ecc71';
                    ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
                    ctx.lineWidth = 1 / scale;
                    ctx.fill();
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    });
    
    canvas.addEventListener('mouseup', function() {
        if (isDrawing) {
            if (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y) {
                // Crear nuevo elemento
                const newElement = {
                    type: currentTool,
                    start: { x: startPoint.x, y: startPoint.y },
                    end: { x: endPoint.x, y: endPoint.y },
                    selected: false
                };
                
                elements.push(newElement);
                saveToHistory();
            }
            
            isDrawing = false;
        }
        
        // Si estábamos redimensionando, guardar en el historial
        if (isResizing) {
            isResizing = false;
            resizeHandle = null;
            saveToHistory();
        }
        
        isDragging = false;
        drawElements();
    });
    
    // Añadir estilos CSS para el drag and drop
    const style = document.createElement('style');
    style.textContent = `
        .furniture-drag-image {
            background-color: #3498db;
            color: white;
            padding: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);
    
    // Función para guardar en historial
    function saveToHistory() {
        // Eliminar estados futuros si estamos en medio del historial
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        
        // Crear copia profunda de todos los pisos
        const floorsClone = JSON.parse(JSON.stringify(floors));
        history.push(floorsClone);
        
        // Limitar tamaño del historial
        if (history.length > 30) {
            history.shift();
        } else {
            historyIndex++;
        }
        
        // Actualizar estado de botones
        document.getElementById('undo-btn').disabled = historyIndex < 0;
        document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
    }
    
    // Función para convertir unidades
    function convertUnits(value, from, to) {
        if (from === to) return value;
        
        // Convertir a píxeles primero
        let pixels = value;
        if (from === 'meters') {
            pixels = value * scaleFactor;
        } else if (from === 'feet') {
            pixels = value * scaleFactor * 0.3048;
        }
        
        // Convertir de píxeles a unidad destino
        if (to === 'pixels') {
            return pixels;
        } else if (to === 'meters') {
            return pixels / scaleFactor;
        } else if (to === 'feet') {
            return pixels / scaleFactor / 0.3048;
        }
        
        return value;
    }
    
    // Función para formatear medidas
    function formatMeasurement(pixels) {
        if (currentUnits === 'pixels') {
            return `${Math.round(pixels)} px`;
        } else if (currentUnits === 'meters') {
            const meters = pixels / scaleFactor;
            return `${meters.toFixed(2)} m`;
        } else if (currentUnits === 'feet') {
            const feet = pixels / scaleFactor / 0.3048;
            return `${feet.toFixed(2)} ft`;
        }
    }
    
    // Eventos para nuevas funcionalidades
    
    // Cambio de unidades
    document.getElementById('units-select').addEventListener('change', function() {
        currentUnits = this.value;
        updatePropertiesPanel();
    });
    
    document.getElementById('scale-factor').addEventListener('change', function() {
        scaleFactor = parseInt(this.value);
        updatePropertiesPanel();
    });
    
    // Gestión de pisos
    document.getElementById('add-floor-btn').addEventListener('click', function() {
        const floorNumber = floors.length;
        floors.push({ name: `Piso ${floorNumber}`, elements: [] });
        
        const option = document.createElement('option');
        option.value = floorNumber;
        option.textContent = `Piso ${floorNumber}`;
        document.getElementById('floor-select').appendChild(option);
        
        saveToHistory();
    });
    
    document.getElementById('floor-select').addEventListener('change', function() {
        // Guardar elementos actuales en el piso actual
        floors[currentFloor].elements = elements;
        
        // Cambiar al nuevo piso
        currentFloor = parseInt(this.value);
        elements = floors[currentFloor].elements;
        selectedElement = null;
        
        drawElements();
        updatePropertiesPanel();
    });
    
    document.getElementById('delete-floor-btn').addEventListener('click', function() {
        if (floors.length <= 1) {
            alert('No se puede eliminar el único piso');
            return;
        }
        
        if (confirm(`¿Estás seguro de que quieres eliminar el ${floors[currentFloor].name}?`)) {
            floors.splice(currentFloor, 1);
            
            // Actualizar selector de pisos
            const floorSelect = document.getElementById('floor-select');
            while (floorSelect.options.length > 0) {
                floorSelect.remove(0);
            }
            
            floors.forEach((floor, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = floor.name;
                floorSelect.appendChild(option);
            });
            
            // Cambiar al primer piso
            currentFloor = 0;
            floorSelect.value = 0;
            elements = floors[currentFloor].elements;
            
            saveToHistory();
            drawElements();
            updatePropertiesPanel();
        }
    });
    
    // Deshacer/Rehacer
    document.getElementById('undo-btn').addEventListener('click', function() {
        if (historyIndex > 0) {
            historyIndex--;
            floors = JSON.parse(JSON.stringify(history[historyIndex]));
            elements = floors[currentFloor].elements;
            drawElements();
            updatePropertiesPanel();
            
            // Actualizar estado de botones
            document.getElementById('undo-btn').disabled = historyIndex <= 0;
            document.getElementById('redo-btn').disabled = false;
        }
    });
    
    document.getElementById('redo-btn').addEventListener('click', function() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            floors = JSON.parse(JSON.stringify(history[historyIndex]));
            elements = floors[currentFloor].elements;
            drawElements();
            updatePropertiesPanel();
            
            // Actualizar estado de botones
            document.getElementById('undo-btn').disabled = false;
            document.getElementById('redo-btn').disabled = historyIndex >= history.length - 1;
        }
    });
    
    // Modo oscuro
    document.getElementById('dark-mode-toggle').addEventListener('click', function() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        this.innerHTML = isDarkMode ? '☀️' : '🌙';
    });
    
    // Variables para el redimensionamiento
    let isResizing = false;
    let resizeHandle = null;
    
    // Biblioteca de muebles con drag and drop
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            const furnitureType = this.getAttribute('data-type');
            const furniture = predefinedFurniture[furnitureType];
            
            if (furniture) {
                // Crear un elemento visual para arrastrar
                const dragImage = document.createElement('div');
                dragImage.className = 'furniture-drag-image';
                dragImage.innerHTML = this.innerHTML;
                dragImage.style.position = 'absolute';
                dragImage.style.left = e.clientX + 'px';
                dragImage.style.top = e.clientY + 'px';
                dragImage.style.pointerEvents = 'none';
                dragImage.style.opacity = '0.7';
                dragImage.style.zIndex = '1000';
                document.body.appendChild(dragImage);
                
                // Cambiar a la herramienta de mueble
                currentTool = 'furniture';
                toolButtons.forEach(btn => btn.classList.remove('active'));
                document.getElementById('furniture-tool').classList.add('active');
                
                // Función para mover la imagen de arrastre
                const moveImage = function(moveEvent) {
                    dragImage.style.left = moveEvent.clientX + 'px';
                    dragImage.style.top = moveEvent.clientY + 'px';
                };
                
                // Función para soltar el mueble en el canvas
                const dropFurniture = function(dropEvent) {
                    document.removeEventListener('mousemove', moveImage);
                    document.removeEventListener('mouseup', dropFurniture);
                    document.body.removeChild(dragImage);
                    
                    // Verificar si el drop fue sobre el canvas
                    const canvasRect = canvas.getBoundingClientRect();
                    if (
                        dropEvent.clientX >= canvasRect.left && 
                        dropEvent.clientX <= canvasRect.right && 
                        dropEvent.clientY >= canvasRect.top && 
                        dropEvent.clientY <= canvasRect.bottom
                    ) {
                        // Convertir coordenadas del drop a coordenadas del canvas
                        const dropPoint = getCanvasCoordinates(dropEvent);
                        const snappedPoint = snapToGridPoint(dropPoint);
                        
                        // Crear nuevo mueble en la posición del drop
                        const newFurniture = {
                            type: 'furniture',
                            start: { x: snappedPoint.x - furniture.width/2, y: snappedPoint.y - furniture.height/2 },
                            end: { x: snappedPoint.x + furniture.width/2, y: snappedPoint.y + furniture.height/2 },
                            selected: true,
                            furnitureType: furnitureType
                        };
                        
                        if (selectedElement) selectedElement.selected = false;
                        selectedElement = newFurniture;
                        elements.push(newFurniture);
                        
                        saveToHistory();
                        drawElements();
                        updatePropertiesPanel();
                    }
                };
                
                // Añadir eventos para el drag and drop
                document.addEventListener('mousemove', moveImage);
                document.addEventListener('mouseup', dropFurniture);
            }
        });
    });
    
    // Herramienta de texto
    document.getElementById('text-tool').addEventListener('click', function() {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        currentTool = 'text';
        canvas.style.cursor = 'text';
    });
    
    // Guardar blueprint
    saveBtn.addEventListener('click', function() {
        // Guardar elementos actuales en el piso actual
        floors[currentFloor].elements = elements;
        
        // Obtener el nombre del blueprint
        blueprintName = document.getElementById('blueprint-name').value || 'Mi Blueprint';
        
        const data = JSON.stringify({
            name: blueprintName,
            floors: floors,
            currentUnits: currentUnits,
            scaleFactor: scaleFactor,
            gridSize: gridSize
        });
        
        localStorage.setItem('blueprint', data);
        alert('Blueprint guardado correctamente');
    });
    
    // Cargar blueprint
    loadBtn.addEventListener('click', function() {
        const data = localStorage.getItem('blueprint');
        
        if (data) {
            const parsed = JSON.parse(data);
            
            if (parsed.floors) {
                floors = parsed.floors;
                currentUnits = parsed.currentUnits || 'pixels';
                scaleFactor = parsed.scaleFactor || 40;
                gridSize = parsed.gridSize || 20;
                blueprintName = parsed.name || 'Mi Blueprint';
                
                // Actualizar nombre del blueprint
                document.getElementById('blueprint-name').value = blueprintName;
                
                // Actualizar selector de pisos
                const floorSelect = document.getElementById('floor-select');
                while (floorSelect.options.length > 0) {
                    floorSelect.remove(0);
                }
                
                floors.forEach((floor, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = floor.name;
                    floorSelect.appendChild(option);
                });
                
                // Cambiar al primer piso
                currentFloor = 0;
                floorSelect.value = 0;
                elements = floors[currentFloor].elements;
                
                // Actualizar controles
                document.getElementById('units-select').value = currentUnits;
                document.getElementById('scale-factor').value = scaleFactor;
                
                drawElements();
                saveToHistory();
                alert('Blueprint cargado correctamente');
            } else {
                // Compatibilidad con versiones anteriores
                elements = JSON.parse(data);
                floors[0].elements = elements;
                drawElements();
                saveToHistory();
                alert('Blueprint cargado correctamente (versión antigua)');
            }
        } else {
            alert('No hay blueprint guardado');
        }
    });
    
    // Exportar blueprint como imagen
    exportBtn.addEventListener('click', function() {
        const exportOptions = document.createElement('div');
        exportOptions.className = 'export-options';
        exportOptions.innerHTML = `
            <h3>Opciones de Exportación</h3>
            <div>
                <label><input type="radio" name="export-type" value="png" checked> PNG</label>
                <label><input type="radio" name="export-type" value="pdf"> PDF</label>
            </div>
            <div>
                <label><input type="checkbox" id="export-all-floors"> Exportar todos los pisos</label>
            </div>
            <div class="export-buttons">
                <button id="export-confirm">Exportar</button>
                <button id="export-cancel">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(exportOptions);
        
        document.getElementById('export-confirm').addEventListener('click', function() {
            const exportType = document.querySelector('input[name="export-type"]:checked').value;
            const exportAllFloors = document.getElementById('export-all-floors').checked;
            
            if (exportType === 'png') {
                // Obtener el nombre del blueprint
                blueprintName = document.getElementById('blueprint-name').value || 'Mi Blueprint';
                
                if (exportAllFloors) {
                    // Guardar elementos actuales
                    floors[currentFloor].elements = elements;
                    
                    // Exportar cada piso como una imagen separada
                    floors.forEach((floor, index) => {
                        // Cambiar temporalmente al piso a exportar
                        elements = floor.elements;
                        drawElements();
                        
                        // Añadir texto con nombre y piso en la esquina inferior izquierda
                        ctx.save();
                        ctx.font = '16px Arial';
                        ctx.fillStyle = isDarkMode ? '#f5f5f5' : '#333';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(`${blueprintName} - ${floor.name}`, 10, canvas.height - 10);
                        ctx.restore();
                        
                        // Exportar
                        const dataURL = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `${blueprintName}_${floor.name}.png`;
                        link.href = dataURL;
                        link.click();
                        
                        // Volver a dibujar sin el texto
                        drawElements();
                    });
                    
                    // Restaurar piso actual
                    elements = floors[currentFloor].elements;
                    drawElements();
                } else {
                    // Exportar solo el piso actual
                    // Dibujar elementos
                    drawElements();
                    
                    // Añadir texto con nombre y piso en la esquina inferior izquierda
                    ctx.save();
                    ctx.font = '16px Arial';
                    ctx.fillStyle = isDarkMode ? '#f5f5f5' : '#333';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(`${blueprintName} - ${floors[currentFloor].name}`, 10, canvas.height - 10);
                    ctx.restore();
                    
                    // Exportar
                    const dataURL = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `${blueprintName}_${floors[currentFloor].name}.png`;
                    link.href = dataURL;
                    link.click();
                    
                    // Volver a dibujar sin el texto
                    drawElements();
                }
            } else if (exportType === 'pdf') {
                alert('Exportación a PDF implementada en una versión futura');
                // Aquí iría la implementación de exportación a PDF
            }
            
            document.body.removeChild(exportOptions);
        });
        
        document.getElementById('export-cancel').addEventListener('click', function() {
            document.body.removeChild(exportOptions);
        });
    });
    
    // Limpiar todo
    clearBtn.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres eliminar todo el blueprint?')) {
            elements = [];
            floors[currentFloor].elements = [];
            selectedElement = null;
            saveToHistory();
            drawElements();
            updatePropertiesPanel();
        }
    });
    
    // Inicializar historial
    saveToHistory();
    
    // Inicializar
    drawGrid();
});