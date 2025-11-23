// Warte, bis die Seite komplett geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const loadStatsBtn = document.getElementById('loadStatsBtn');
    const container = document.querySelector('.container');
    // Container für die verschiedenen Bereiche holen
    const mainInfoContainer = document.getElementById('main-info-container');
    const tabNav = document.getElementById('tab-nav');
    const tabCombat = document.getElementById('tab-combat');
    const tabCrime = document.getElementById('tab-crime');
    const tabEconomy = document.getElementById('tab-economy');
    const tabWork = document.getElementById('tab-work');
    const tabContracts = document.getElementById('tab-contracts');
    const tabTravel = document.getElementById('tab-travel');
    const tabRacing = document.getElementById('tab-racing');
    const comparePlayerInput = document.getElementById('comparePlayerInput');
    const addComparePlayerBtn = document.getElementById('addComparePlayerBtn');
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesList = document.getElementById('favorites-list');

    // Zustand für den Vergleich
    let comparisonPlayers = [];
    let favorites = [];

    /**
     * Hilfsfunktion: Formatiert Sekunden in Jahre, Monate, Wochen, Tage.
     */
    function formatAge(days) {
        let remainingDays = days;
        const years = Math.floor(remainingDays / 365);
        remainingDays %= 365;
        const months = Math.floor(remainingDays / 30); // Vereinfachung
        remainingDays %= 30;

        return `${years}J / ${months}M / ${remainingDays}T`;
    }

    /**
     * Hilfsfunktion: Erstellt eine Statistik-Karte für die Tabs.
     */
    function createStatsCard(title, stats) {
        let tableHTML = `<div class="stats-card"><h2>${title}</h2><div class="table-wrapper"><table class="integrated-comparison-table">`;

        // Kopfzeile mit Spielernamen für die Tabs hinzufügen
        tableHTML += '<thead><tr><th>Statistik</th>';
        comparisonPlayers.forEach(p => {
            tableHTML += `<th>${p.name}[${p.player_id}]</th>`;
        });
        tableHTML += '</tr></thead>';


        tableHTML += '<tbody>';

        for (const [label, getValue] of Object.entries(stats)) {
            tableHTML += `<tr><td>${label}</td>`;
            comparisonPlayers.forEach(player => {
                const rawValue = getValue(player);
                const formattedValue = typeof rawValue === 'number' && !isNaN(rawValue) ? rawValue.toLocaleString('de-DE') : (rawValue ?? 'N/A');
                // Füge das data-Attribut mit dem rohen Wert hinzu
                tableHTML += `<td data-raw-value="${rawValue}">${formattedValue}</td>`;
            });
            tableHTML += '</tr>';
        }

        tableHTML += '</tbody></table></div></div>';
        return tableHTML;
    }

    /**
     * Füllt den Haupt-Informationsbereich.
     */
    function displayMainInfo() {
        const stats = {
            "Level": p => p.level,
            "Alter": p => p.age,
            "Spielzeit": p => Math.floor(p.personalstats.useractivity / 3600),
            "Networth": p => p.personalstats.networth,
            "Xanax": p => p.personalstats.xantaken,
            "Drogen gesamt": p => p.personalstats.drugsused,
            "Überdosen": p => p.personalstats.overdosed,
            "Alkohol": p => p.personalstats.alcoholused,
            "Süßigkeiten": p => p.personalstats.candyused,
            "Energy Drinks": p => p.personalstats.energydrinkused,
            "Energy Refills": p => p.personalstats.refills, // nerverefills ist doppelt
            "Nerve Refills": p => p.personalstats.nerverefills,
        };

        let tableHTML = '<div class="table-wrapper"><table class="integrated-comparison-table"><thead><tr><th>Spieler</th>';
        comparisonPlayers.forEach(p => {
            const isMainPlayer = comparisonPlayers[0].player_id === p.player_id;
            const statusText = p.status.description + (p.status.details && p.status.details.trim() !== '' ? `<br>${p.status.details}` : '');
            const isFavorite = favorites.some(fav => fav.id === p.player_id);
            const favoriteIcon = isFavorite ? '⭐' : '☆';
            const removeButton = isMainPlayer ? '' : `<button class="remove-player-btn" data-id="${p.player_id}">✖</button>`;
            tableHTML += `<th>${p.name}[${p.player_id}] <button class="favorite-toggle-btn" data-id="${p.player_id}" data-name="${p.name}">${favoriteIcon}</button>${removeButton}<br><small>${p.rank}<br>${statusText}</small></th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        for (const [label, getValue] of Object.entries(stats)) {
            tableHTML += `<tr><td>${label}</td>`;
            comparisonPlayers.forEach(player => {
                const rawValue = getValue(player);
                let formattedValue = rawValue;

                // Spezifische Formatierung für die Anzeige
                if (typeof rawValue === 'number' && !isNaN(rawValue)) {
                    if (label === "Networth") {
                        formattedValue = `$${rawValue.toLocaleString('de-DE')}`;
                    } else if (label === "Spielzeit") {
                        formattedValue = `${rawValue.toLocaleString('de-DE')} Std.`;
                    } else if (label === "Alter") {
                        formattedValue = `${rawValue.toLocaleString('de-DE')} Tage (${formatAge(rawValue)})`;
                    } else {
                        formattedValue = rawValue.toLocaleString('de-DE');
                    }
                }
                // Füge das data-Attribut mit dem rohen Wert hinzu
                tableHTML += `<td data-raw-value="${rawValue}">${formattedValue}</td>`;
            });
            tableHTML += '</tr>';
        }

        tableHTML += '</tbody></table></div>';
        mainInfoContainer.innerHTML = tableHTML;

        // Event-Listener für die neuen Favoriten-Buttons hinzufügen
        document.querySelectorAll('.favorite-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, name } = e.currentTarget.dataset;
                toggleFavorite(parseInt(id), name);
            });
        });

        document.querySelectorAll('.remove-player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idToRemove = parseInt(e.currentTarget.dataset.id);
                removePlayerFromComparison(idToRemove);
            });
        });

        initComparisonDragAndDrop();
    }

    /**
     * Füllt die Tabs mit den Detail-Statistiken.
     */
    function displayTabbedStats() {
        // Tab-Inhalte leeren
        tabCombat.innerHTML = '';
        tabCrime.innerHTML = '';
        tabEconomy.innerHTML = '';
        tabWork.innerHTML = '';
        tabContracts.innerHTML = '';
        tabTravel.innerHTML = '';
        tabRacing.innerHTML = '';

        // --- KAMPF-TAB ---
        tabCombat.innerHTML = createStatsCard('Kampf', {
            "Angriffe gewonnen": p => p.personalstats.attackswon, "Angriffe verloren": p => p.personalstats.attackslost,
            "Angriffe unentschieden": p => p.personalstats.attacksdraw, "Verteidigungen gewonnen": p => p.personalstats.defendswon,
            "Verteidigungen verloren": p => p.personalstats.defendslost, "Ausgeführter Schaden": p => p.personalstats.attackdamage,
            "Höchster Schaden": p => p.personalstats.bestdamage, "Runden abgefeuert": p => p.personalstats.roundsfired
        });

        // --- KRIMINALITÄT-TAB ---
        tabCrime.innerHTML = createStatsCard('Kriminalität', {
            "Verbrechen": p => p.personalstats.criminaloffenses, "Ausbrüche (Fehlschläge)": p => p.personalstats.failedbusts,
            "Ausbrüche (Erfolge)": p => p.personalstats.peoplebusted, "Im Gefängnis": p => p.personalstats.jailed,
            "Im Krankenhaus": p => p.personalstats.hospital, "Organisierte Verbrechen": p => p.personalstats.organisedcrimes
        });

        // --- WIRTSCHAFT-TAB ---
        tabEconomy.innerHTML = createStatsCard('Wirtschaft', {
            "Basar-Verkäufe": p => p.personalstats.bazaarsales, "Basar-Profit": p => p.personalstats.bazaarprofit,
            "Item Markt-Verkäufe": p => p.personalstats.itemmarketsales, "Item Markt-Profit": p => p.personalstats.itemmarketrevenue,
            "Handel": p => p.personalstats.trades, "Geld gemuggt": p => p.personalstats.moneymugged,
            "Größter Mug": p => p.personalstats.largestmug
        });

        // --- WORKING STATS-TAB ---
        tabWork.innerHTML = createStatsCard('Arbeitsstatistiken', {
            "Manuell": p => p.personalstats.manuallabor,
            "Intelligenz": p => p.personalstats.intelligence,
            "Ausdauer": p => p.personalstats.endurance,
            "Total": p => (p.personalstats.manuallabor + p.personalstats.intelligence + p.personalstats.endurance),
            "Genutzte Job-Punkte": p => p.personalstats.jobpointsused
        });

        // --- CONTRACTS & BOUNTIES-TAB ---
        tabContracts.innerHTML = createStatsCard('Aufträge & Missionen', {
            "Abgeschlossene Verträge (Duke)": p => p.personalstats.contractscompleted,
            "Verdiente Missions-Credits": p => p.personalstats.missioncreditsearned,
            "Platzierte Kopfgelder": p => p.personalstats.bountiesplaced,
            "Gesammelte Kopfgelder": p => p.personalstats.bountiescollected,
            "Erhaltener Kopfgeld-Wert": p => p.personalstats.receivedbountyvalue,
            "Ausgegeben für Kopfgelder": p => p.personalstats.totalbountyspent
        });

        // --- TRAVEL-TAB ---
        tabTravel.innerHTML = createStatsCard('Reisen', {
            "Gereist (Anzahl)": p => p.personalstats.traveltimes,
            "Items im Ausland gekauft": p => p.personalstats.itemsboughtabroad,
            "Reisen nach Argentinien": p => p.personalstats.argtravel, "Reisen nach Mexiko": p => p.personalstats.mextravel,
            "Reisen nach Kanada": p => p.personalstats.cantravel, "Reisen nach Hawaii": p => p.personalstats.hawtravel,
            "Reisen nach Japan": p => p.personalstats.japtravel, "Reisen nach UK": p => p.personalstats.lontravel,
            "Reisen nach Südafrika": p => p.personalstats.soutravel, "Reisen in die Schweiz": p => p.personalstats.switravel,
            "Reisen nach China": p => p.personalstats.chitravel, "Reisen in die VAE": p => p.personalstats.dubtravel,
            "Reisen auf die Cayman Inseln": p => p.personalstats.caytravel
        });

        // --- RACING-TAB ---
        tabRacing.innerHTML = createStatsCard('Rennen', {
            "Racing Skill": p => p.personalstats.racingskill,
            "Teilgenommene Rennen": p => p.personalstats.racesentered,
            "Gewonnene Rennen": p => p.personalstats.raceswon,
            "Verdiente Racing Points": p => p.personalstats.racingpointsearned
        });

        // Tab-Navigation erstellen und Logik hinzufügen
        setupTabs();
        // Hover-Effekte für Ranking hinzufügen, nachdem die Tabellen erstellt wurden
        addHoverRankingListeners();
    }

    /**
     * Erstellt die Tab-Buttons und fügt die Klick-Logik hinzu.
     */
    function setupTabs() {
        tabNav.innerHTML = ''; // Leeren für den Fall eines erneuten Ladens

        const tabs = [
            { id: 'tab-combat', label: 'Kampf' },
            { id: 'tab-crime', label: 'Kriminalität' },
            { id: 'tab-economy', label: 'Wirtschaft' },
            { id: 'tab-work', label: 'Arbeit' },
            { id: 'tab-contracts', label: 'Aufträge' },
            { id: 'tab-travel', label: 'Reisen' },
            { id: 'tab-racing', label: 'Rennen' }
        ];

        tabs.forEach((tab, index) => {
            const button = document.createElement('button');
            button.className = 'tab-button';
            if (index === 0) button.classList.add('active'); // Ersten Tab aktivieren
            button.dataset.tab = tab.id;
            button.textContent = tab.label;
            tabNav.appendChild(button);
        });

        // Standardmäßig ersten Tab anzeigen
        document.querySelector('.tab-pane').classList.add('active');

        tabNav.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const targetTab = e.target.dataset.tab;

                // Alle Buttons und Panes deaktivieren
                tabNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

                // Ziel-Button und -Pane aktivieren
                e.target.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            }
        });
    }

    /**
     * Initialisiert Drag & Drop für die Spalten der Vergleichstabelle.
     */
    function initComparisonDragAndDrop() {
        const headerRow = document.querySelector('.integrated-comparison-table thead tr');
        if (!headerRow) return;

        new Sortable(headerRow, {
            animation: 150,
            filter: '.favorite-toggle-btn, .remove-player-btn', // Buttons nicht ziehbar machen
            preventOnFilter: true,
            onEnd: (evt) => {
                // Hauptspieler (Index 0) kann nicht verschoben werden
                if (evt.oldIndex === 0 || evt.newIndex === 0) {
                    // Drag-Vorgang abbrechen (visuell rückgängig machen) - SortableJS hat keine native "cancel" Methode
                    displayMainInfo(); // Einfach neu rendern, um die alte Ordnung wiederherzustellen
                    return;
                }
                const movedPlayer = comparisonPlayers.splice(evt.oldIndex, 1)[0];
                comparisonPlayers.splice(evt.newIndex, 0, movedPlayer);
                displayMainInfo();
                displayTabbedStats();
            }
        });
    }

    /**
     * Fügt allen Tabellenzeilen Hover-Listener für das Ranking hinzu.
     */
    function addHoverRankingListeners() {
        const rows = document.querySelectorAll('.integrated-comparison-table tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseover', handleRowHover);
            row.addEventListener('mouseout', handleRowMouseOut);
        });
    }

    /**
     * Konvertiert einen Prozentwert (0-1) in eine Farbe von Rot über Gelb nach Grün.
     */
    function percentageToHsl(percentage) {
        // Hue geht von 0 (Rot) bis 120 (Grün)
        const hue = percentage * 120;
        return `hsl(${hue}, 90%, 45%)`;
    }

    /**
     * Behandelt das Hover-Event auf einer Tabellenzeile und zeigt das Ranking an.
     */
    function handleRowHover(event) {
        const row = event.currentTarget;
        const cells = Array.from(row.querySelectorAll('td')).slice(1); // Alle Wert-Zellen, erste Zelle (Label) überspringen

        // 1. Werte extrahieren und in ein Array mit Referenz zum Element packen
        const playerValues = cells.map(cell => ({
            value: parseFloat(cell.dataset.rawValue),
            cell: cell
        })).filter(item => !isNaN(item.value)); // Nur numerische Werte berücksichtigen

        if (playerValues.length < 2) return; // Kein Ranking bei nur einem Spieler

        const minVal = Math.min(...playerValues.map(p => p.value));
        const maxVal = Math.max(...playerValues.map(p => p.value));

        // 2. Nach Wert absteigend sortieren
        playerValues.sort((a, b) => b.value - a.value);

        // 3. Ranking-Symbole erstellen und hinzufügen
        let lastValue = null;
        let currentRank = 0;
        playerValues.forEach((item, index) => {
            // Logik für "Dense Ranking" (1, 2, 2, 3)
            if (item.value !== lastValue) {
                currentRank = index + 1;
            }
            lastValue = item.value;

            const rankSpan = document.createElement('span');
            rankSpan.className = 'ranking-icon';
            // Zeige nur die Nummer in Klammern an
            rankSpan.textContent = `(${currentRank})`;
            
            // Sicherstellen, dass nicht mehrere Icons hinzugefügt werden
            if (!item.cell.querySelector('.ranking-icon')) {
                item.cell.appendChild(rankSpan);
            }

            // Hintergrundfarbe basierend auf dem prozentualen Wert setzen
            if (maxVal > minVal) {
                const percentage = (item.value - minVal) / (maxVal - minVal);
                item.cell.style.backgroundColor = percentageToHsl(percentage);
            } else {
                item.cell.style.backgroundColor = percentageToHsl(1); // Alle sind gleich gut -> grün
            }
        });
    }

    /**
     * Behandelt das Mouse-Out-Event und entfernt die Ranking-Symbole.
     */
    function handleRowMouseOut(event) {
        const row = event.currentTarget;
        const icons = row.querySelectorAll('.ranking-icon');
        icons.forEach(icon => icon.remove());

        // Hintergrundfarbe zurücksetzen
        row.querySelectorAll('td').forEach(cell => cell.style.backgroundColor = '');
    }


    // Funktion, um Daten von der Torn API zu laden
    async function fetchTornStats(apiKey) {
        const selections = 'profile,personalstats';
        const endpoint = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}`;

        mainInfoContainer.innerHTML = '<p>Lade Daten...</p>';
        tabNav.innerHTML = '';
        document.querySelectorAll('.tab-pane').forEach(p => p.innerHTML = '');

        // Vergleichs-Container leeren und Spielerliste zurücksetzen
        comparisonPlayers = [];

        try {
            // Using POST is slightly more secure as the key is not in the URL
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new URLSearchParams({ selections, key: apiKey })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.error);
            }
            console.log("Komplette API-Antwort:", data);

            // Füge den Hauptspieler zur Vergleichsliste hinzu
            comparisonPlayers.push(data);

            // Rufe die neuen Display-Funktionen auf
            displayMainInfo();
            displayTabbedStats();
            updateContainerWidth();

            localStorage.setItem('tornApiKey', apiKey);

        } catch (error) {
            mainInfoContainer.innerHTML = `<p class="error">Ein Fehler ist aufgetreten: ${error.message}</p>`;
            console.error('Fehler beim Abrufen der Torn API:', error);
        }
    }

    loadStatsBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Verhindert Neuladen der Seite, falls in einem Form
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            fetchTornStats(apiKey);
        } else {
            mainInfoContainer.innerHTML = '<p>Bitte gib einen API Key ein.</p>';
        }
    });

    /**
     * Fügt einen Spieler zur Vergleichsliste hinzu.
     */
    async function addPlayerToComparison(playerID) {
        const apiKey = apiKeyInput.value.trim();

        if (!playerID || !/^\d+$/.test(playerID)) {
            alert('Bitte gib eine gültige Spieler-ID ein (nur aus Zahlen bestehend).');
            return;
        }
        if (!apiKey) {
            alert('Bitte lade zuerst deine eigenen Statistiken mit einem gültigen API Key.');
            return;
        }
        if (comparisonPlayers.length === 0) {
            alert('Bitte lade zuerst deine eigenen Statistiken.');
            return;
        }

        addComparePlayerBtn.textContent = 'Lade...';
        addComparePlayerBtn.disabled = true;

        try {
            // Für andere Spieler fragen wir nur öffentliche Daten ab.
            // Die Spieler-ID wird im Pfad der URL übergeben.
            const selections = 'profile,personalstats';
            const endpoint = `https://api.torn.com/user/${playerID}?selections=${selections}&key=${apiKey}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                body: new URLSearchParams({ selections, key: apiKey })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.error);
            }

            // Prüfen, ob der Spieler schon in der Liste ist
            if (comparisonPlayers.some(p => p.player_id === data.player_id)) {
                alert('Dieser Spieler ist bereits in der Vergleichsliste.');
            } else {
                comparisonPlayers.push(data);
                // Alle Statistiken neu rendern, um den neuen Spieler einzubeziehen
                displayMainInfo();
                displayTabbedStats();
                updateContainerWidth();
            }
            comparePlayerInput.value = ''; // Eingabefeld leeren

        } catch (error) {
            alert(`Fehler beim Hinzufügen des Spielers: ${error.message}`);
        } finally {
            addComparePlayerBtn.textContent = 'Spieler hinzufügen';
            addComparePlayerBtn.disabled = false;
        }
    }

    addComparePlayerBtn.addEventListener('click', () => {
        const playerID = comparePlayerInput.value.trim();
        if (playerID) {
            addPlayerToComparison(playerID);
        }
    });

    /**
     * Passt die Breite des Hauptcontainers an, basierend auf der Anzahl der Spieler.
     */
    function updateContainerWidth() {
        if (comparisonPlayers.length > 3) {
            container.classList.add('wide');
        } else {
            container.classList.remove('wide');
        }
    }


    /**
     * Entfernt einen Favoriten aus der Liste.
     */
    function removeFavorite(id) {
        const playerIndex = favorites.findIndex(fav => fav.id === id);
        if (playerIndex > -1) {
            favorites.splice(playerIndex, 1);
            saveFavorites();
            renderFavorites();
            // UI aktualisieren, um den Stern zu ändern, falls der Spieler im Vergleich ist
            if (comparisonPlayers.length > 0) displayMainInfo();
        }
    }

    /**
     * Lade Favoriten aus dem Local Storage.
     */
    function loadFavorites() {
        const savedFavorites = localStorage.getItem('tornFavorites');
        if (savedFavorites) {
            favorites = JSON.parse(savedFavorites);
        }
        renderFavorites();
    }

    /**
     * Entfernt einen Spieler aus der Vergleichsliste.
     */
    function removePlayerFromComparison(playerID) {
        const playerIndex = comparisonPlayers.findIndex(p => p.player_id === playerID);
        if (playerIndex > 0) { // Stelle sicher, dass der Hauptspieler (Index 0) nicht entfernt wird
            comparisonPlayers.splice(playerIndex, 1);
            // Alle Statistiken neu rendern
            displayMainInfo();
            displayTabbedStats();
            updateContainerWidth();
        }
    }


    /**
     * Zeige die Favoriten-Buttons an.
     */
    function renderFavorites() {
        favoritesList.innerHTML = '';
        if (favorites.length > 0) {
            favoritesSection.style.display = 'block';
            favorites.forEach(fav => {
                const itemWrapper = document.createElement('div');
                itemWrapper.className = 'favorite-item';
                itemWrapper.dataset.id = fav.id; // Für SortableJS

                const favBtn = document.createElement('button');
                favBtn.className = 'favorite-btn';
                favBtn.textContent = `${fav.name} [${fav.id}]`;
                favBtn.addEventListener('click', () => addPlayerToComparison(fav.id));

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-fav-btn';
                removeBtn.innerHTML = '✖';
                removeBtn.addEventListener('click', () => removeFavorite(fav.id));

                itemWrapper.appendChild(favBtn);
                itemWrapper.appendChild(removeBtn);
                favoritesList.appendChild(itemWrapper);
            });

            // Drag & Drop für Favoriten initialisieren
            new Sortable(favoritesList, {
                animation: 150,
                onEnd: onFavoriteDragEnd
            });
        } else {
            favoritesSection.style.display = 'none';
        }
    }

    /**
     * Speichere Favoriten im Local Storage.
     */
    function saveFavorites() {
        localStorage.setItem('tornFavorites', JSON.stringify(favorites));
    }

    /**
     * Fügt einen Spieler zu den Favoriten hinzu oder entfernt ihn.
     */
    function onFavoriteDragEnd(evt) {
        const movedItem = favorites.splice(evt.oldIndex, 1)[0];
        favorites.splice(evt.newIndex, 0, movedItem);
        saveFavorites();
    }

    /**
     * Fügt einen Spieler zu den Favoriten hinzu oder entfernt ihn.
     */
    function toggleFavorite(id, name) {
        const playerIndex = favorites.findIndex(fav => fav.id === id);
        if (playerIndex > -1) {
            // Entfernen
            favorites.splice(playerIndex, 1);
        } else {
            // Hinzufügen
            favorites.push({ id, name });
        }
        saveFavorites();
        renderFavorites();
        displayMainInfo(); // UI aktualisieren, um den Stern zu ändern
    }

    // API-Key aus dem Local Storage laden, falls vorhanden
    const savedApiKey = localStorage.getItem('tornApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Initiales Laden der Favoriten
    loadFavorites();

    // Automatisches Laden der Statistiken, wenn ein API-Key vorhanden ist
    if (savedApiKey) {
        fetchTornStats(savedApiKey);
    }
});