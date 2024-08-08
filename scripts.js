document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded');
    const sleepForm = document.getElementById('sleepForm');
    const sleepDataContainer = document.getElementById('sleepDataContainer');
    const dateInput = document.getElementById('date');
    const searchInput = document.getElementById('searchInput');
    const myChart = document.getElementById('myChart')?.getContext('2d');
    let chartInstance;

    if (!sleepForm || !sleepDataContainer || !dateInput || !myChart || !searchInput) {
        console.error('One or more elements are missing. Ensure all elements exist in the HTML.');
        return;
    }

    // Set date input to today's date by default
    dateInput.value = new Date().toISOString().split('T')[0];

    sleepForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Form submitted');

        const date = new Date(document.getElementById('date').value).toISOString().split('T')[0];
        const hours = parseFloat(document.getElementById('hours').value);
        const sleepTime = parseFloat(document.getElementById('sleepTime').value);
        const quality = parseInt(document.getElementById('quality').value);
        const wakeups = parseInt(document.getElementById('wakeups').value);
        const mood = parseInt(document.getElementById('mood').value);
        const notes = document.getElementById('notes').value || "";

        console.log('Date:', date);
        console.log('Hours:', hours);
        console.log('Sleep Time:', sleepTime);
        console.log('Quality:', quality);
        console.log('Wakeups:', wakeups);
        console.log('Mood:', mood);
        console.log('Notes:', notes);

        if (validateForm(hours, sleepTime, quality, wakeups, mood)) {
            saveData(date, hours, sleepTime, quality, wakeups, mood, notes);
            loadData();
            updateChart();
        }
    });

    function validateForm(hours, sleepTime, quality, wakeups, mood) {
        if (isNaN(hours) || hours < 0 || hours > 24) {
            alert('Please enter a valid number of hours (0-24), up to three decimal places.');
            return false;
        }
        if (isNaN(sleepTime) || sleepTime < 0) {
            alert('Time to fall asleep cannot be negative and should be a valid decimal number.');
            return false;
        }
        if (isNaN(quality) || quality < 1 || quality > 10) {
            alert('Please enter a valid sleep quality rating (1-10).');
            return false;
        }
        if (isNaN(wakeups) || wakeups < 0) {
            alert('Number of wake-ups cannot be negative.');
            return false;
        }
        if (isNaN(mood) || mood < 1 || mood > 10) {
            alert('Please enter a valid morning mood rating (1-10).');
            return false;
        }
        return true;
    }

    function saveData(date, hours, sleepTime, quality, wakeups, mood, notes) {
        let sleepData = JSON.parse(localStorage.getItem('sleepData')) || [];
        const existingIndex = sleepData.findIndex(data => data.date === date);
        if (existingIndex !== -1) {
            sleepData[existingIndex] = { date, hours, sleepTime, quality, wakeups, mood, notes };
        } else {
            sleepData.push({ date, hours, sleepTime, quality, wakeups, mood, notes });
        }
        localStorage.setItem('sleepData', JSON.stringify(sleepData));
        console.log('Data saved:', sleepData);
    }

    function loadData() {
        const sleepData = JSON.parse(localStorage.getItem('sleepData')) || [];
        sleepData.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort data in ascending order
        sleepDataContainer.innerHTML = '';
        sleepData.forEach(({ date, hours, sleepTime, quality, wakeups, mood, notes }) => {
            const item = document.createElement('div');
            item.className = 'sleepDataItem';

            const dateObject = new Date(date);
            dateObject.setDate(dateObject.getDate() + 1); // Add one day
            const formattedDate = dateObject.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            const details = document.createElement('details');
            details.dataset.date = date; // Store the date in a data attribute for easy access
            const summaryElement = document.createElement('summary');
            summaryElement.textContent = formattedDate;
            details.appendChild(summaryElement);

            const sleepInfo = document.createElement('div');
            sleepInfo.innerHTML = `
                <p><strong>Hours Slept:</strong> ${hours.toFixed(2)}</p>
                <p><strong>Time to Fall Asleep:</strong> ${sleepTime.toFixed(1)} minutes</p>
                <p><strong>Sleep Quality:</strong> ${quality}</p>
                <p><strong>Number of Wake-ups:</strong> ${wakeups}</p>
                <p><strong>Morning Mood:</strong> ${mood}</p>
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            `;
            details.appendChild(sleepInfo);

            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'deleteButton';
            deleteButton.textContent = '×';
            deleteButton.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete all sleep data for ${formattedDate}?`)) {
                    deleteData(date);
                    loadData();
                    updateChart();
                }
            });
            item.appendChild(deleteButton);

            item.appendChild(details); // Make sure the details element is inside the item div

            sleepDataContainer.appendChild(item);
        });
        console.log('Data loaded:', sleepData);
    }

    function deleteData(date) {
        let sleepData = JSON.parse(localStorage.getItem('sleepData')) || [];
        sleepData = sleepData.filter(data => data.date !== date);
        localStorage.setItem('sleepData', JSON.stringify(sleepData));
        console.log(`Data for ${date} deleted:`, sleepData);
    }

    function updateChart(timeRange = 'all') {
        const sleepData = JSON.parse(localStorage.getItem('sleepData')) || [];
        if (sleepData.length === 0) {
            console.warn('No sleep data available for chart update.');
            return;
        }

        const sortedData = sleepData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const mostRecentDate = new Date(sortedData[sortedData.length - 1].date);
        let startDate;

        switch (timeRange) {
            case 'week':
                startDate = new Date(mostRecentDate);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(mostRecentDate);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(mostRecentDate);
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'all':
            default:
                startDate = new Date(sortedData[0].date);
                break;
        }

        const filteredData = sortedData.filter(data => new Date(data.date) >= startDate);

        if (filteredData.length === 0) {
            console.warn('No filtered sleep data available for chart update.');
            return;
        }

        const labels = filteredData.map(data => data.date);
        const hoursData = filteredData.map(data => data.hours);

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(myChart, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Duration Over Time',
                    data: hoursData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'MMM dd',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours Slept',
                            padding: {
                                left: 20 // Add space for y-axis units
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            box1: {
                                type: 'box',
                                yMin: 7,
                                yMax: 12,
                                backgroundColor: 'rgba(75, 192, 192, 0.15)',
                                borderColor: 'rgba(75, 192, 192, 0.5)',
                                borderWidth: 1,
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.05, // Less sensitive zoom
                            },
                            pinch: {
                                enabled: true,
                                speed: 0.05, // Less sensitive zoom
                            },
                            mode: 'x',
                            rangeMin: {
                                x: new Date(filteredData[0].date).getTime() // Limit minimum zoom to first date
                            },
                            rangeMax: {
                                x: new Date(filteredData[filteredData.length - 1].date).getTime() // Limit maximum zoom to last date
                            }
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                            rangeMin: {
                                x: new Date(filteredData[0].date).getTime() // Limit minimum pan to first date
                            },
                            rangeMax: {
                                x: new Date(filteredData[filteredData.length - 1].date).getTime() // Limit maximum pan to last date
                            }
                        }
                    }
                },
                onClick: (evt, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const date = chartInstance.data.labels[index];
                        const formattedDate = new Date(date + "T00:00:00Z").toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        });
                        const detailsElements = document.querySelectorAll('details');
                        detailsElements.forEach(detail => {
                            const summaryElement = detail.querySelector('summary');
                            if (summaryElement.textContent === formattedDate) {
                                detail.open = true;
                                detail.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    }
                }
            }
        });
        console.log('Chart updated');
    }

    function resetZoom() {
        if (chartInstance) {
            chartInstance.resetZoom();
        }
    }

    function setTimeRange(range) {
        updateChart(range);
    }

    function downloadImage() {
        if (confirm("Do you want to download the graph as a PDF?")) {
            const canvas = document.getElementById('myChart');
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'sleep_tracker.png';
            link.click();
        }
    }

    // Ensure setTimeRange and downloadImage are accessible
    window.setTimeRange = setTimeRange;
    window.downloadImage = downloadImage;
    window.resetZoom = resetZoom;

    // Initial load of data
    loadData();
    updateChart();

    // Search functionality with improvements
    searchInput.addEventListener('input', debounce(filterSleepData, 300));

    function filterSleepData() {
        const filter = searchInput.value.toLowerCase();
        const sleepDataItems = document.querySelectorAll('.sleepDataItem');

        let hasResults = false;
        sleepDataItems.forEach(item => {
            const dateText = item.querySelector('summary').textContent.toLowerCase();
            if (dateText.includes(filter)) {
                item.style.display = '';
                highlightText(item, filter);
                hasResults = true;
            } else {
                item.style.display = 'none';
                removeHighlight(item);
            }
        });

        if (!hasResults) {
            const noResults = document.createElement('p');
            noResults.textContent = 'No results found.';
            noResults.className = 'noResults';
            sleepDataContainer.appendChild(noResults);
        } else {
            const noResultsMessage = document.querySelector('.noResults');
            if (noResultsMessage) {
                noResultsMessage.remove();
            }
        }

        // Remove highlights if search is cleared
        if (filter === '') {
            sleepDataItems.forEach(item => {
                removeHighlight(item);
            });
        }
    }

    function highlightText(element, filter) {
        const textNodes = getTextNodes(element);
        textNodes.forEach(node => {
            const match = node.nodeValue.toLowerCase().indexOf(filter);
            if (match >= 0) {
                const span = document.createElement('span');
                span.className = 'highlight';
                const matchedText = node.splitText(match);
                matchedText.splitText(filter.length);
                span.appendChild(matchedText.cloneNode(true));
                matchedText.parentNode.replaceChild(span, matchedText);
            }
        });
    }

    function removeHighlight(element) {
        const highlights = element.querySelectorAll('.highlight');
        highlights.forEach(span => {
            span.replaceWith(...span.childNodes);
        });
    }

    function getTextNodes(node) {
        const textNodes = [];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
        } else {
            node.childNodes.forEach(child => textNodes.push(...getTextNodes(child)));
        }
        return textNodes;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});
