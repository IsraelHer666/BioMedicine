document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/api/low-stock');
    const { lowStockMedications } = await response.json();

    if (lowStockMedications.length > 0) {
        const lowStockModal = document.getElementById('lowStockModal');
        const lowStockList = document.getElementById('lowStockList');
        
        // Añadir los medicamentos al pop-up
        lowStockMedications.forEach(medication => {
            const listItem = document.createElement('li');
            listItem.textContent = `${medication.name} - Stock: ${medication.stock}`;
            lowStockList.appendChild(listItem);
        });

        // Mostrar el pop-up
        lowStockModal.style.display = 'block';

        // Cerrar el pop-up cuando se haga clic en el botón de cerrar
        document.getElementById('closeLowStockModal').onclick = () => {
            lowStockModal.style.display = 'none';
        };

        // Cerrar el pop-up cuando se haga clic fuera del modal
        window.onclick = (event) => {
            if (event.target === lowStockModal) {
                lowStockModal.style.display = 'none';
            }
        };
    }
});
