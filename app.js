document.addEventListener('DOMContentLoaded', () => {
    const resultElement = document.getElementById('barcode-result');
    const manualBarcodeInput = document.getElementById('manual-barcode');
    const submitButton = document.getElementById('submit-barcode');
    const scanButton = document.getElementById('scan-barcode');
    const enableCorsButton = document.getElementById('enable-cors');
    const scannerContainer = document.getElementById('scanner-container');
    const physicalShopsList = document.getElementById('physical-shops-list');
    const onlineShopsList = document.getElementById('online-shops-list');

    function submitBarcode(code) {
        resultElement.textContent = code;

        // Try to fetch results, if it fails, redirect to the website
        fetchResults(code).catch(() => {
            redirectToWebsite(code);
        });
    }

    function startScanner() {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerContainer,
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: "environment" // Use the back camera on mobile devices
                }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
            }
        }, (err) => {
            if (err) {
                console.error(err);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            const code = data.codeResult.code;
            submitBarcode(code);
        });
    }

    scanButton.addEventListener('click', () => {
        scannerContainer.style.display = 'block';
        startScanner();
    });

    submitButton.addEventListener('click', () => {
        const manualCode = manualBarcodeInput.value;
        if (manualCode) {
            submitBarcode(manualCode);
        }
    });

    enableCorsButton.addEventListener('click', () => {
        window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
    });

    async function fetchResults(code) {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl = 'https://chp.co.il';
        const response = await fetch(proxyUrl + targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'product_name_or_barcode': code,
                'shopping_address': 'ראש העין'
            })
        });

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const tables = doc.querySelectorAll('.results-table');
        const results = { physicalShops: [], onlineShops: [] };
        const keywords = ["ויקטורי", "רמי לוי", "שופרסל"];

        if (tables.length >= 2) {
            const physicalShopRows = tables.querySelectorAll('tr');
            const onlineShopRows = tables.querySelectorAll('tr');

            physicalShopRows.forEach(row => {
                const rowText = row.innerText;
                if (keywords.some(keyword => rowText.startsWith(keyword))) {
                    results.physicalShops.push(rowText);
                }
            });

            onlineShopRows.forEach(row => {
                const rowText = row.innerText;
                if (keywords.some(keyword => rowText.startsWith(keyword))) {
                    results.onlineShops.push(rowText);
                }
            });
        }

        displayResults(results);
    }

    function displayResults(results) {
        physicalShopsList.innerHTML = '';
        onlineShopsList.innerHTML = '';

        results.physicalShops.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            physicalShopsList.appendChild(li);
        });

        results.onlineShops.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            onlineShopsList.appendChild(li);
        });
    }

    function redirectToWebsite(code) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://chp.co.il';

        const barcodeInput = document.createElement('input');
        barcodeInput.type = 'hidden';
        barcodeInput.name = 'product_name_or_barcode';
        barcodeInput.value = code;
        form.appendChild(barcodeInput);

        const addressInput = document.createElement('input');
        addressInput.type = 'hidden';
        addressInput.name = 'shopping_address';
        addressInput.value = 'ראש העין';
        form.appendChild(addressInput);

        document.body.appendChild(form);
        form.submit();
    }
});
