document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-sale-form');
    const salesTableBody = document.getElementById('sales-table-body');
    const medicationsTableBody = document.getElementById('medications-table-body');
    const saleConfirmationModal = document.getElementById('sale-confirmation-modal');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const errorModal = document.getElementById('error-modal');
    const closeSaleModalSpan = document.querySelector('#sale-confirmation-modal .close');
    const closeDeleteModalSpan = document.querySelector('#delete-confirmation-modal .close');
    const closeErrorModalSpan = document.querySelector('#error-modal .close');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');
    let saleToDelete = null;

    // Marca las filas con stock 0 en rojo al cargar la página
    const markLowStockRows = () => {
        const rows = medicationsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const stockCell = row.querySelectorAll('td')[5];
            if (stockCell && parseInt(stockCell.textContent) === 0) {
                row.classList.add('low-stock');
            } else {
                row.classList.remove('low-stock');
            }
        });
    };
    markLowStockRows(); // Llamar a la función al cargar la página

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const response = await fetch('/api/register-sale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                const sale = result.sale;
                const medication = result.medication;

                // Agregar nueva fila a la tabla de ventas
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${medication.name}</td>
                    <td>${sale.quantity}</td>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                    <td>${new Date(sale.date).toLocaleTimeString()}</td>
                    <td>${medication.price}</td>
                    <td>${sale.quantity * medication.price}</td>
                    <td><button class="delete-sale-button" data-id="${sale.id}">Eliminar</button></td>
                `;
                salesTableBody.appendChild(newRow);
                
                // Actualizar la tabla de stock
                updateStockTable(medication);

                // Mostrar el modal de confirmación
                saleConfirmationModal.style.display = 'block';
                setTimeout(() => location.reload(), 1000); // Recargar la página después de 1 segundo
            } else {
                const error = await response.json();
                document.getElementById('error-message').textContent = error.message;
                errorModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
    


    // Actualizar el stock en la tabla
    const updateStockTable = (updatedMedication) => {
        const rows = medicationsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const nameCell = cells[0];
            if (nameCell && nameCell.textContent === updatedMedication.name) {
                cells[5].textContent = updatedMedication.stock;
                if (updatedMedication.stock === 0) {
                    row.classList.add('low-stock');
                } else {
                    row.classList.remove('low-stock');
                }
            }
        });
    };

    // Manejo del botón de eliminar venta
    salesTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-sale-button')) {
            saleToDelete = event.target;
            deleteConfirmationModal.style.display = 'block';
        }
    }); 
    // Confirmar eliminación de venta
    confirmDeleteButton.addEventListener('click', async () => {
        if (saleToDelete) {
            const saleId = saleToDelete.getAttribute('data-id');
            const row = saleToDelete.closest('tr');

            try {
                const response = await fetch(`/api/sales/${saleId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Actualizar el stock en la tabla
                    const result = await response.json();
                    const updatedMedication = result.medication;
                    updateStockTable(updatedMedication);

                    // Elimina la fila de la tabla
                    row.remove();
                    deleteConfirmationModal.style.display = 'none';
                     // Recargar la página después de 1 segundo
                     setTimeout(() => location.reload(), 100); 
                } else {
                    const error = await response.json(); // Captura el mensaje de error del servidor
                    document.getElementById('error-message').textContent = error.message;
                    errorModal.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });

   


    // Cancelar eliminación de venta
    cancelDeleteButton.addEventListener('click', () => {
        deleteConfirmationModal.style.display = 'none';
        saleToDelete = null;
    });

    // Cerrar modales
    closeSaleModalSpan.addEventListener('click', () => {
        saleConfirmationModal.style.display = 'none';
    });

    closeDeleteModalSpan.addEventListener('click', () => {
        deleteConfirmationModal.style.display = 'none';
        saleToDelete = null;
    });

    closeErrorModalSpan.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === saleConfirmationModal) {
            saleConfirmationModal.style.display = 'none';
        }
        if (event.target === deleteConfirmationModal) {
            deleteConfirmationModal.style.display = 'none';
            saleToDelete = null;
        }
        if (event.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
});
