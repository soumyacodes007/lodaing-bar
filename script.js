window.addEventListener("load", () => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis();
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Initialize arrays and variables
    const images = Array(7).fill(null);
    let loadedImageCount = 0;

    function loadImages() {
        for (let i = 1; i <= 7; i++) {
            const img = new Image();
            const index = i - 1;

            img.onload = function() {
                console.log(`Image ${i} loaded successfully`);
                images[index] = img;
                loadedImageCount++;
                
                if (loadedImageCount === 7) {
                    console.log('All images loaded, initializing scene');
                    initializeScene();
                }
            };

            img.onerror = function(err) {
                console.error(`Error loading image ${i}:`, err);
                loadedImageCount++;
                
                if (loadedImageCount === 7) {
                    console.log('Finished loading attempts, initializing scene');
                    initializeScene();
                }
            };

            img.src = `./assets/img${i}.jpg`;
        }
    }

    function initializeScene() {
        // Scene setup
        const scene = new THREE.Scene();
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector("canvas"),
            antialias: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);

        // Geometry setup
        const parentWidth = 25;
        const parentHeight = 80;
        const curvature = 45;
        const segmentsX = 200;
        const segmentsY = 200;

        const parentGeometry = new THREE.PlaneGeometry(
            parentWidth,
            parentHeight,
            segmentsX,
            segmentsY
        );

        // Apply curvature
        const positions = parentGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const y = positions[i + 1];
            const distanceFromCenter = Math.abs(y) / (parentHeight / 2);
            positions[i + 2] = Math.pow(distanceFromCenter, 1.8) * curvature;

            positions[i] += Math.pow(distanceFromCenter, 2) * 2;
        }
        parentGeometry.computeVertexNormals();

        // Constants for slides
        const totalSlides = 7;
        const slideHeight = 15;
        const gap = 0.5;
        const cycleHeight = totalSlides * (slideHeight + gap);
        const extraSlides = 2;

        // Canvas texture setup
        const textureCanvas = document.createElement("canvas");
        const ctx = textureCanvas.getContext("2d", {
            alpha: false,
            willReadFrequently: false,
        });
        textureCanvas.width = 2048;
        textureCanvas.height = 8192;

        // Texture setup
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

        // Material setup
        const parentMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        // Mesh setup
        const parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
        parentMesh.position.set(0, 0, -5);
        parentMesh.rotation.x = THREE.MathUtils.degToRad(35);
        parentMesh.rotation.y = THREE.MathUtils.degToRad(25);
        scene.add(parentMesh);

        // Camera positioning
        const distance = 20;
        const heightOffset = 8;
        const offsetX = distance * Math.sin(THREE.MathUtils.degToRad(20));
        const offsetZ = distance * Math.cos(THREE.MathUtils.degToRad(20));
        camera.position.set(offsetX, heightOffset, offsetZ);
        camera.lookAt(0, 0, -5);
        camera.rotation.z = THREE.MathUtils.degToRad(-8);

        // Slide titles
        const slideTitles = [
            "Field Unit",
            "Astral Convergence",
            "Eclipse Core",
            "Luminous",
            "Serenity",
            "Nebula Point",
            "Horizon",
        ];

        function updateTexture(offset = 0) {
            // Clear canvas
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

            // Text setup
            const fontSize = 180;
            ctx.font = `500 ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Calculate individual slide height
            const canvasSlideHeight = textureCanvas.height / totalSlides;

            for (let i = -extraSlides; i < totalSlides + extraSlides; i++) {
                // Calculate slide position
                const baseY = i * canvasSlideHeight;
                let slideY = baseY - (offset * textureCanvas.height);
                let wrappedY = ((slideY % textureCanvas.height) + textureCanvas.height) % textureCanvas.height;

                // Define slide rectangle
                const slideRect = {
                    x: textureCanvas.width * 0.05,
                    y: wrappedY,
                    width: textureCanvas.width * 0.9,
                    height: canvasSlideHeight * 0.9
                };

                // Get correct image index
                const slideIndex = ((i % totalSlides) + totalSlides) % totalSlides;
                const img = images[slideIndex];

                if (img) {
                    // Calculate image dimensions
                    const imgAspect = img.width / img.height;
                    const rectAspect = slideRect.width / slideRect.height;
                    let drawWidth, drawHeight, drawX, drawY;

                    if (imgAspect > rectAspect) {
                        drawHeight = slideRect.height;
                        drawWidth = drawHeight * imgAspect;
                        drawX = slideRect.x + (slideRect.width - drawWidth) / 2;
                        drawY = slideRect.y;
                    } else {
                        drawWidth = slideRect.width;
                        drawHeight = drawWidth / imgAspect;
                        drawX = slideRect.x;
                        drawY = slideRect.y + (slideRect.height - drawHeight) / 2;
                    }

                    // Draw image
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(
                        slideRect.x,
                        slideRect.y,
                        slideRect.width,
                        slideRect.height,
                        10
                    );
                    ctx.clip();
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    ctx.restore();

                    // Draw title
                    ctx.fillStyle = "white";
                    ctx.fillText(
                        slideTitles[slideIndex],
                        textureCanvas.width / 2,
                        wrappedY + slideRect.height / 2
                    );
                }
            }
            texture.needsUpdate = true;
        }

        // Scroll handling
        let currentScroll = 0;
        lenis.on("scroll", ({ scroll, limit }) => {
            currentScroll = scroll / limit;
            updateTexture(currentScroll);
            renderer.render(scene, camera);
        });

        // Window resize handling
        let resizeTimeout;
        window.addEventListener("resize", () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 250);
        });

        // Initial render
        updateTexture();
        renderer.render(scene, camera);
    }

    // Start loading images
    loadImages();
});