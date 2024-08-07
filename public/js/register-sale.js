document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-sale-form');
    const salesTableBody = document.getElementById('sales-table-body');
    const medicationsTableBody = document.getElementById('medications-table-body');
    const modal = document.getElementById('sale-confirmation-modal');
    const closeModal = document.querySelector('.modal .close');
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
  
      try {
        const response = await fetch('/api/register-sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
  
        if (response.ok) {
          const result = await response.json();
          
          // Actualizar la tabla de ventas
                const newRow = document.createElement('tr');
                const saleDate = new Date(result.sale.date);
                newRow.innerHTML = 
                `<td>${result.sale.medication.name}</td>
                <td>${result.sale.quantity}</td>
                <td>${saleDate.toLocaleDateString()}</td>
                <td>${saleDate.toLocaleTimeString()}</td>
                <td>${result.sale.medication.price}</td>`;
                salesTableBody.appendChild(newRow);
  
          // Actualizar la tabla de stock
          const medicationRow = Array.from(medicationsTableBody.children).find(row => row.cells[0].innerText === result.medication.name);
          if (medicationRow) {
            medicationRow.cells[5].innerText = result.medication.stock;
          }
  
          // Mostrar el modal de confirmación
          modal.style.display = 'block';
        } else {
          const error = await response.json();
          alert(error.message);
        }
      } catch (error) {
        console.error('Error al registrar la venta:', error);
      }
    });
  
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
});
