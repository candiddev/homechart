package models

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// Data contains all Homechart data.
type Data struct {
	AuthAccounts              AuthAccounts              `json:"authAccounts"`
	AuthAccountAuthHouseholds AuthAccountAuthHouseholds `json:"authAccountAuthHouseholds"`
	AuthHouseholds            AuthHouseholds            `json:"authHouseholds"`
	AuthSessions              AuthSessions              `json:"authSessions"`
	Bookmarks                 Bookmarks                 `json:"bookmarks"`
	BudgetAccounts            BudgetAccounts            `json:"budgetAccounts"`
	BudgetCategories          BudgetCategories          `json:"budgetCategories"`
	BudgetMonths              BudgetMonths              `json:"budgetMonths"`
	BudgetMonthCategories     BudgetMonthCategories     `json:"-"`
	BudgetPayees              BudgetPayees              `json:"budgetPayees"`
	BudgetRecurrences         BudgetRecurrences         `json:"budgetRecurrences"`
	BudgetTransactions        BudgetTransactions        `json:"budgetTransactions"`
	CalendarEvents            CalendarEvents            `json:"calendarEvents"`
	CalendarICalendars        CalendarICalendars        `json:"calendarICalendars"`
	CookMealTimes             CookMealTimes             `json:"cookMealTimes"`
	CookMealPlans             CookMealPlans             `json:"cookMealPlans"`
	CookRecipes               CookRecipes               `json:"cookRecipes"`
	HealthItems               HealthItems               `json:"healthItems"`
	HealthLogs                HealthLogs                `json:"healthLogs"`
	InventoryCollections      InventoryCollections      `json:"inventoryCollections"`
	InventoryItems            InventoryItems            `json:"inventoryItems"`
	NotesPages                NotesPages                `json:"notesPages"`
	NotesPageVersions         NotesPageVersions         `json:"notesPageVersions"`
	PlanProjects              PlanProjects              `json:"planProjects"`
	PlanTasks                 PlanTasks                 `json:"planTasks"`
	RewardCards               RewardCards               `json:"rewardCards"`
	SecretsValues             SecretsValues             `json:"secretsValues"`
	SecretsVaults             SecretsVaults             `json:"secretsVaults"`
	ShopCategories            ShopCategories            `json:"shopCategories"`
	ShopItems                 ShopItems                 `json:"shopItems"`
	ShopLists                 ShopLists                 `json:"shopLists"`
}

// DataFromByte reads data from a byte array and optionally decrypts it.
func DataFromByte(ctx context.Context, ba []byte, encryptionKey string) (*Data, errs.Err) {
	ctx = logger.Trace(ctx)

	i := ba

	// Decrypt byte if encryption key provided
	if encryptionKey != "" && len(ba) > aes.BlockSize {
		bk := []byte(encryptionKey)
		if len(bk) < 32 {
			tmp := make([]byte, 32)
			copy(tmp[32-len(bk):], bk)
			bk = tmp
		} else if len(bk) > 32 {
			bk = bk[len(bk)-32:]
		}

		block, err := aes.NewCipher(bk)
		if err != nil {
			return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
		}

		iv := ba[:aes.BlockSize]
		cipherText := ba[aes.BlockSize:]

		mode := cipher.NewCBCDecrypter(block, iv)
		mode.CryptBlocks(cipherText, cipherText)

		i = cipherText
	}

	// Decompress bytes
	gzipBuffer := bytes.NewBuffer(i)

	zr, err := gzip.NewReader(gzipBuffer)
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	err = zr.Close()
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	// Decode to struct
	d := &Data{}
	decoder := gob.NewDecoder(zr)

	err = decoder.Decode(d)
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	return d, logger.Error(ctx, nil)
}

// DataFromDatabase reads all data for a AuthHousehold from the database.
func DataFromDatabase(ctx context.Context, id uuid.UUID) (*Data, errs.Err) { //nolint:gocognit,gocyclo
	ctx = logger.Trace(ctx)

	d := &Data{}

	household := AuthHousehold{
		ID: id,
	}

	if err := household.Read(ctx); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.AuthHouseholds = append(d.AuthHouseholds, household)

	ahp := &AuthHouseholdsPermissions{
		{
			AuthHouseholdID: id,
		},
	}

	aaah := AuthAccountAuthHouseholds{}
	if _, _, err := ReadAll(ctx, &aaah, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.AuthAccountAuthHouseholds = append(d.AuthAccountAuthHouseholds, aaah...)

	for i := range household.Members {
		account := AuthAccount{
			ID: household.Members[i].ID,
		}

		if err := account.Read(ctx); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if account.PrimaryAuthHouseholdID == nil || account.PrimaryAuthHouseholdID.UUID != id {
			continue
		}

		d.AuthAccounts = append(d.AuthAccounts, account)

		aa := household.Members[i].ID

		if err := d.readAuthSessions(ctx, &aa); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readCalendarEvents(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readCalendarICalendars(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readBookmarks(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readHealthItems(ctx, &aa); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readHealthLogs(ctx, &aa); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readPlanProjects(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readPlanTasks(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readShopItems(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readShopLists(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readNotesPages(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readNotesPageVersions(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readSecretsValues(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}

		if err := d.readSecretsVaults(ctx, &aa, nil); err != nil {
			return nil, logger.Error(ctx, err)
		}
	}

	if err := d.readBookmarks(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	budgetAccounts := BudgetAccounts{}

	if _, _, err := ReadAll(ctx, &budgetAccounts, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.BudgetAccounts = append(d.BudgetAccounts, budgetAccounts...)
	budgetCategories := BudgetCategories{}

	if _, _, err := ReadAll(ctx, &budgetCategories, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.BudgetCategories = append(d.BudgetCategories, budgetCategories...)
	budgetPayees := BudgetPayees{}

	if _, _, err := ReadAll(ctx, &budgetPayees, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.BudgetPayees = append(d.BudgetPayees, budgetPayees...)

	budgetRecurrences := BudgetRecurrences{}

	if _, _, err := ReadAll(ctx, &budgetRecurrences, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.BudgetRecurrences = append(d.BudgetRecurrences, budgetRecurrences...)

	for j := range d.BudgetAccounts {
		transactions, _, err := BudgetTransactionsReadAccount(ctx, d.BudgetAccounts[j].ID, 0, 9999999)
		if err != nil {
			return nil, logger.Error(ctx, err)
		}

		if transactions == nil {
			continue
		}

		for _, transaction := range transactions {
			match := false

			for l := range d.BudgetTransactions {
				if d.BudgetTransactions[l].ID == transaction.ID {
					match = true

					break
				}
			}

			if !match {
				d.BudgetTransactions = append(d.BudgetTransactions, transaction)
			}
		}
	}

	cookMealPlans := CookMealPlans{}

	if _, _, err := ReadAll(ctx, &cookMealPlans, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.CookMealPlans = append(d.CookMealPlans, cookMealPlans...)
	cookMealTimes := CookMealTimes{}

	if _, _, err := ReadAll(ctx, &cookMealTimes, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.CookMealTimes = append(d.CookMealTimes, cookMealTimes...)
	cookRecipes := CookRecipes{}

	if _, _, err := ReadAll(ctx, &cookRecipes, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.CookRecipes = append(d.CookRecipes, cookRecipes...)
	inventoryCollections := InventoryCollections{}

	if _, _, err := ReadAll(ctx, &inventoryCollections, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.InventoryCollections = append(d.InventoryCollections, inventoryCollections...)
	inventoryItems := InventoryItems{}

	if _, _, err := ReadAll(ctx, &inventoryItems, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.InventoryItems = append(d.InventoryItems, inventoryItems...)

	if err := d.readPlanProjects(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	if err := d.readPlanTasks(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	rewardCards := RewardCards{}

	if _, _, err := ReadAll(ctx, &rewardCards, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.RewardCards = append(d.RewardCards, rewardCards...)

	if err := d.readSecretsValues(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	if err := d.readSecretsVaults(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	shopCategories := ShopCategories{}

	if _, _, err := ReadAll(ctx, &shopCategories, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return nil, logger.Error(ctx, err)
	}

	d.ShopCategories = append(d.ShopCategories, shopCategories...)

	if err := d.readShopItems(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	if err := d.readShopLists(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	if err := d.readNotesPages(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	if err := d.readNotesPageVersions(ctx, nil, ahp); err != nil {
		return nil, logger.Error(ctx, err)
	}

	return d, nil
}

// ExportByte converts data to a gob, compresses and optionally encrypts it.
func (d *Data) ExportByte(ctx context.Context, encryptionKey string) ([]byte, errs.Err) {
	ctx = logger.Trace(ctx)

	// Encode to gob
	gobBuffer := bytes.Buffer{}
	encoder := gob.NewEncoder(&gobBuffer)

	err := encoder.Encode(d)
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	// Compress
	gzipBuffer := bytes.Buffer{}

	zw := gzip.NewWriter(&gzipBuffer)
	zw.ModTime = time.Time{}

	_, err = zw.Write(gobBuffer.Bytes())
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	err = zw.Close()
	if err != nil {
		return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	// Encrypt if key provided
	if encryptionKey != "" {
		// Key needs to be 32 characters
		ba := []byte(encryptionKey)
		if len(ba) < 32 {
			tmp := make([]byte, 32)
			copy(tmp[32-len(ba):], ba)
			ba = tmp
		} else if len(ba) > 32 {
			ba = ba[len(ba)-32:]
		}

		block, err := aes.NewCipher(ba)
		if err != nil {
			return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
		}

		// Pad input to aes block size
		padding := aes.BlockSize - len(gzipBuffer.Bytes())%aes.BlockSize
		padText := bytes.Repeat([]byte{byte(padding)}, padding)
		input := append(gzipBuffer.Bytes(), padText...)

		cipherText := make([]byte, aes.BlockSize+len(input))
		iv := cipherText[:aes.BlockSize]

		if _, err := io.ReadFull(rand.Reader, iv); err != nil {
			panic(err)
		}

		mode := cipher.NewCBCEncrypter(block, iv)
		mode.CryptBlocks(cipherText[aes.BlockSize:], input)

		return cipherText, logger.Error(ctx, nil)
	}

	return gzipBuffer.Bytes(), logger.Error(ctx, nil)
}

// ExportDisk copies the data to disk.  There isn't a read from disk option, so this is only used for generating data for the UI.
func (d *Data) ExportDisk(ctx context.Context, path string) errs.Err {
	ctx = logger.Trace(ctx)

	// Create file
	f, err := os.Create(path)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	defer f.Close()

	// Mashsall JSON and indent
	j, err := json.MarshalIndent(d, "", "    ")
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	// Output to file
	_, err = f.Write(j)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	return logger.Error(ctx, nil)
}

// Restore inserts the data elements into the database.
func (d *Data) Restore(ctx context.Context, seed bool) errs.Err { //nolint:gocognit,gocyclo
	ctx = logger.Trace(ctx)

	// Delete accounts if already existing
	for i := range d.AuthAccounts {
		var a AuthAccount

		a.EmailAddress = d.AuthAccounts[i].EmailAddress
		if err := a.ReadPasswordHash(ctx); err != nil {
			logger.Error(ctx, err) //nolint:errcheck
		}

		if err := a.Delete(ctx); err != nil {
			logger.Error(ctx, err) //nolint:errcheck
		}
	}

	AuthHouseholdsDeleteEmptyAndExpired(ctx)

	if err := d.createAuthHouseholds(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createAuthAccounts(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createAuthAccountAuthHouseholds(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if GetAuthAccountID(ctx) == uuid.Nil {
		ctx = SetAuthAccountID(ctx, d.AuthAccounts[0].ID)
	}

	if err := d.createAuthSessions(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBookmarks(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetAccounts(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetCategories(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetMonthCategories(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetPayees(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetRecurrences(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createBudgetTransactions(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createCalendarICalendars(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createCalendarEvents(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createCookMealTimes(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createCookRecipes(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createCookMealPlans(ctx); err != nil { // Needs to be after recipes and meal times
		return logger.Error(ctx, err)
	}

	if err := d.createHealthItems(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createHealthLogs(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createInventoryCollections(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createInventoryItems(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createNotesPages(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createNotesPageVersions(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createPlanProjects(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createPlanTasks(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createRewardCards(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createSecretsVaults(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createSecretsValues(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createShopCategories(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createShopLists(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if err := d.createShopItems(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if seed {
		for j := range d.AuthAccountAuthHouseholds {
			if j < 3 && d.AuthAccountAuthHouseholds[j].AuthAccountID != nil {
				if err := InitAccount(ctx, *d.AuthAccountAuthHouseholds[j].AuthAccountID); err != nil {
					return logger.Error(ctx, err)
				}
			}
		}

		if err := InitHousehold(ctx, d.AuthAccountAuthHouseholds[0].AuthHouseholdID, *d.AuthAccountAuthHouseholds[0].AuthAccountID); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

// Send uploads a backup to the backup endpoint.
func (d *Data) Send(ctx context.Context, authHouseholdID uuid.UUID, backupEncryptionKey string) errs.Err {
	ctx = logger.Trace(ctx)

	data, err := d.ExportByte(ctx, backupEncryptionKey)
	if err != nil {
		return logger.Error(ctx, err)
	}

	r, errr := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/api/v1/cloud/%s/backups", c.App.CloudEndpoint, authHouseholdID), bytes.NewBuffer(data))
	if errr != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(errr))
	}

	client := &http.Client{}

	res, errr := client.Do(r)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(errr))
	}

	defer res.Body.Close()

	return logger.Error(ctx, nil)
}

func (d *Data) createAuthAccounts(ctx context.Context) errs.Err { //nolint:gocognit,gocyclo
	ctx = logger.Trace(ctx)

	for i := range d.AuthAccounts {
		oldID := d.AuthAccounts[i].ID

		if err := d.AuthAccounts[i].Create(ctx, true); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.AuthAccounts[i].ID

		for j := range d.AuthAccountAuthHouseholds {
			if d.AuthAccountAuthHouseholds[j].AuthAccountID != nil && *d.AuthAccountAuthHouseholds[j].AuthAccountID == oldID {
				d.AuthAccountAuthHouseholds[j].AuthAccountID = &newID
			}
		}

		for j := range d.AuthSessions {
			if d.AuthSessions[j].AuthAccountID == oldID {
				d.AuthSessions[j].AuthAccountID = newID
			}
		}

		for j := range d.Bookmarks {
			if d.Bookmarks[j].AuthAccountID != nil && *d.Bookmarks[j].AuthAccountID == oldID {
				d.Bookmarks[j].AuthAccountID = &newID
			}
		}

		for j := range d.CalendarEvents {
			if d.CalendarEvents[j].AuthAccountID != nil && *d.CalendarEvents[j].AuthAccountID == oldID {
				d.CalendarEvents[j].AuthAccountID = &newID
			}

			for k := range d.CalendarEvents[j].Participants {
				if d.CalendarEvents[j].Participants[k] == oldID.String() {
					d.CalendarEvents[j].Participants[k] = newID.String()
				}
			}
		}

		for j := range d.CalendarICalendars {
			if d.CalendarICalendars[j].AuthAccountID != nil && *d.CalendarICalendars[j].AuthAccountID == oldID {
				d.CalendarICalendars[j].AuthAccountID = &newID
			}
		}

		for j := range d.CookMealPlans {
			if d.CookMealPlans[j].AuthAccountID != nil && *d.CookMealPlans[j].AuthAccountID == oldID {
				d.CookMealPlans[j].AuthAccountID = &newID
			}
		}

		for j := range d.HealthItems {
			if d.HealthItems[j].AuthAccountID == oldID {
				d.HealthItems[j].AuthAccountID = newID
			}
		}

		for j := range d.HealthLogs {
			if d.HealthLogs[j].AuthAccountID == oldID {
				d.HealthLogs[j].AuthAccountID = newID
			}
		}

		for j := range d.NotesPages {
			if d.NotesPages[j].AuthAccountID != nil && *d.NotesPages[j].AuthAccountID == oldID {
				d.NotesPages[j].AuthAccountID = &newID
			}
		}

		for j := range d.NotesPageVersions {
			if d.NotesPageVersions[j].CreatedBy == oldID {
				d.NotesPageVersions[j].CreatedBy = newID
			}
		}

		for j := range d.PlanProjects {
			if d.PlanProjects[j].AuthAccountID != nil && *d.PlanProjects[j].AuthAccountID == oldID {
				d.PlanProjects[j].AuthAccountID = &newID
			}
		}

		for j := range d.PlanTasks {
			if d.PlanTasks[j].AuthAccountID != nil && *d.PlanTasks[j].AuthAccountID == oldID {
				d.PlanTasks[j].AuthAccountID = &newID
			}

			for i := range d.PlanTasks[j].Assignees {
				if d.PlanTasks[j].Assignees[i] == oldID.String() {
					d.PlanTasks[j].Assignees[i] = newID.String()
				}
			}
		}

		for j := range d.RewardCards {
			for k := range d.RewardCards[j].Recipients {
				if d.RewardCards[j].Recipients[k] == oldID.String() {
					d.RewardCards[j].Recipients[k] = newID.String()
				}
			}

			for k := range d.RewardCards[j].Senders {
				if d.RewardCards[j].Senders[k] == oldID.String() {
					d.RewardCards[j].Senders[k] = newID.String()
				}
			}
		}

		for j := range d.SecretsVaults {
			if d.SecretsVaults[j].AuthAccountID != nil && *d.SecretsVaults[j].AuthAccountID == oldID {
				d.SecretsVaults[j].AuthAccountID = &newID
			}

			for k := range d.SecretsVaults[j].Keys {
				if d.SecretsVaults[j].Keys[k].AuthAccountID == oldID {
					d.SecretsVaults[j].Keys[k].AuthAccountID = newID
				}
			}
		}

		for j := range d.ShopItems {
			if d.ShopItems[j].AuthAccountID != nil && *d.ShopItems[j].AuthAccountID == oldID {
				d.ShopItems[j].AuthAccountID = &newID
			}
		}

		for j := range d.ShopLists {
			if d.ShopLists[j].AuthAccountID != nil && *d.ShopLists[j].AuthAccountID == oldID {
				d.ShopLists[j].AuthAccountID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createAuthAccountAuthHouseholds(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.AuthAccountAuthHouseholds {
		if err := Create(ctx, &d.AuthAccountAuthHouseholds[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createAuthHouseholds(ctx context.Context) errs.Err { //nolint:gocyclo,gocognit
	ctx = logger.Trace(ctx)

	for i := range d.AuthHouseholds {
		oldID := d.AuthHouseholds[i].ID

		if err := d.AuthHouseholds[i].Create(ctx, true); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.AuthHouseholds[i].ID

		for j := range d.AuthAccountAuthHouseholds {
			if d.AuthAccountAuthHouseholds[j].AuthHouseholdID == oldID {
				d.AuthAccountAuthHouseholds[j].AuthHouseholdID = newID
			}
		}

		for j := range d.Bookmarks {
			if d.Bookmarks[j].AuthHouseholdID != nil && *d.Bookmarks[j].AuthHouseholdID == oldID {
				d.Bookmarks[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.BudgetAccounts {
			if d.BudgetAccounts[j].AuthHouseholdID == oldID {
				d.BudgetAccounts[j].AuthHouseholdID = newID
			}
		}

		for j := range d.BudgetCategories {
			if d.BudgetCategories[j].AuthHouseholdID == oldID {
				d.BudgetCategories[j].AuthHouseholdID = newID
			}
		}

		for j := range d.BudgetMonthCategories {
			if d.BudgetMonthCategories[j].AuthHouseholdID == oldID {
				d.BudgetMonthCategories[j].AuthHouseholdID = newID
			}
		}

		for j := range d.BudgetPayees {
			if d.BudgetPayees[j].AuthHouseholdID == oldID {
				d.BudgetPayees[j].AuthHouseholdID = newID
			}
		}

		for j := range d.BudgetRecurrences {
			if d.BudgetRecurrences[j].AuthHouseholdID == oldID {
				d.BudgetRecurrences[j].AuthHouseholdID = newID
			}
		}

		for j := range d.BudgetTransactions {
			if d.BudgetTransactions[j].AuthHouseholdID == oldID {
				d.BudgetTransactions[j].AuthHouseholdID = newID
			}
		}

		for j := range d.CalendarEvents {
			if d.CalendarEvents[j].AuthHouseholdID != nil && *d.CalendarEvents[j].AuthHouseholdID == oldID {
				d.CalendarEvents[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.CalendarICalendars {
			if d.CalendarICalendars[j].AuthHouseholdID != nil && *d.CalendarICalendars[j].AuthHouseholdID == oldID {
				d.CalendarICalendars[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.CookMealPlans {
			if d.CookMealPlans[j].AuthHouseholdID == oldID {
				d.CookMealPlans[j].AuthHouseholdID = newID
			}
		}

		for j := range d.CookMealTimes {
			if d.CookMealTimes[j].AuthHouseholdID == oldID {
				d.CookMealTimes[j].AuthHouseholdID = newID
			}
		}

		for j := range d.CookRecipes {
			if d.CookRecipes[j].AuthHouseholdID == oldID {
				d.CookRecipes[j].AuthHouseholdID = newID
			}
		}

		for j := range d.InventoryCollections {
			if d.InventoryCollections[j].AuthHouseholdID == oldID {
				d.InventoryCollections[j].AuthHouseholdID = newID
			}
		}

		for j := range d.InventoryItems {
			if d.InventoryItems[j].AuthHouseholdID == oldID {
				d.InventoryItems[j].AuthHouseholdID = newID
			}
		}

		for j := range d.NotesPages {
			if d.NotesPages[j].AuthHouseholdID != nil && *d.NotesPages[j].AuthHouseholdID == oldID {
				d.NotesPages[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.PlanProjects {
			if d.PlanProjects[j].AuthHouseholdID != nil && *d.PlanProjects[j].AuthHouseholdID == oldID {
				d.PlanProjects[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.PlanTasks {
			if d.PlanTasks[j].AuthHouseholdID != nil && *d.PlanTasks[j].AuthHouseholdID == oldID {
				d.PlanTasks[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.RewardCards {
			if d.RewardCards[j].AuthHouseholdID == oldID {
				d.RewardCards[j].AuthHouseholdID = newID
			}
		}

		for j := range d.SecretsVaults {
			if d.SecretsVaults[j].AuthHouseholdID != nil && *d.SecretsVaults[j].AuthHouseholdID == oldID {
				d.SecretsVaults[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.ShopCategories {
			if d.ShopCategories[j].AuthHouseholdID == oldID {
				d.ShopCategories[j].AuthHouseholdID = newID
			}
		}

		for j := range d.ShopItems {
			if d.ShopItems[j].AuthHouseholdID != nil && *d.ShopItems[j].AuthHouseholdID == oldID {
				d.ShopItems[j].AuthHouseholdID = &newID
			}
		}

		for j := range d.ShopLists {
			if d.ShopLists[j].AuthHouseholdID != nil && *d.ShopLists[j].AuthHouseholdID == oldID {
				d.ShopLists[j].AuthHouseholdID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createAuthSessions(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.AuthSessions {
		if err := d.AuthSessions[i].Create(ctx, true); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBookmarks(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.Bookmarks {
		if err := Create(ctx, &d.Bookmarks[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetAccounts(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.BudgetAccounts {
		oldID := d.BudgetAccounts[i].ID

		if err := Create(ctx, &d.BudgetAccounts[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.BudgetAccounts[i].ID

		for j := range d.BudgetRecurrences {
			if d.BudgetRecurrences[j].BudgetAccountID == oldID {
				d.BudgetRecurrences[j].BudgetAccountID = newID
			}

			for k := range d.BudgetRecurrences[j].Template.Accounts {
				if d.BudgetRecurrences[j].Template.Accounts[k].BudgetAccountID != nil && *d.BudgetRecurrences[j].Template.Accounts[k].BudgetAccountID == oldID {
					d.BudgetRecurrences[j].Template.Accounts[k].BudgetAccountID = &newID
				}
			}
		}

		for j := range d.BudgetTransactions {
			for k := range d.BudgetTransactions[j].Accounts {
				if d.BudgetTransactions[j].Accounts[k].BudgetAccountID != nil && *d.BudgetTransactions[j].Accounts[k].BudgetAccountID == oldID {
					d.BudgetTransactions[j].Accounts[k].BudgetAccountID = &newID
				}
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetCategories(ctx context.Context) errs.Err { //nolint:gocognit
	ctx = logger.Trace(ctx)

	for i := range d.BudgetCategories {
		oldID := d.BudgetCategories[i].ID

		if err := d.BudgetCategories[i].Validate(); err != nil {
			return logger.Error(ctx, err)
		}

		if err := Create(ctx, &d.BudgetCategories[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.BudgetCategories[i].ID

		for j := range d.BudgetMonthCategories {
			if d.BudgetMonthCategories[j].BudgetCategoryID == oldID {
				d.BudgetMonthCategories[j].BudgetCategoryID = newID
			}
		}

		for j := range d.BudgetPayees {
			if d.BudgetPayees[j].BudgetCategoryID != nil && *d.BudgetPayees[j].BudgetCategoryID == oldID {
				d.BudgetPayees[j].BudgetCategoryID = &newID
			}
		}

		for j := range d.BudgetRecurrences {
			for k := range d.BudgetRecurrences[j].Template.Categories {
				if d.BudgetRecurrences[j].Template.Categories[k].BudgetCategoryID != nil && *d.BudgetRecurrences[j].Template.Categories[k].BudgetCategoryID == oldID {
					d.BudgetRecurrences[j].Template.Categories[k].BudgetCategoryID = &newID
				}
			}
		}

		for j := range d.BudgetTransactions {
			for k := range d.BudgetTransactions[j].Categories {
				if d.BudgetTransactions[j].Categories[k].BudgetCategoryID != nil && *d.BudgetTransactions[j].Categories[k].BudgetCategoryID == oldID {
					d.BudgetTransactions[j].Categories[k].BudgetCategoryID = &newID
				}
			}
		}

		for j := range d.PlanProjects {
			if d.PlanProjects[j].BudgetCategoryID != nil && *d.PlanProjects[j].BudgetCategoryID == oldID {
				d.PlanProjects[j].BudgetCategoryID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetMonthCategories(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.BudgetMonthCategories {
		if err := d.BudgetMonthCategories[i].Create(ctx); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetPayees(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.BudgetPayees {
		oldID := d.BudgetPayees[i].ID

		if err := Create(ctx, &d.BudgetPayees[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.BudgetPayees[i].ID

		for j := range d.BudgetRecurrences {
			if d.BudgetRecurrences[j].Template.BudgetPayeeID != nil && *d.BudgetRecurrences[j].Template.BudgetPayeeID == oldID {
				d.BudgetRecurrences[j].Template.BudgetPayeeID = &newID
			}
		}

		for j := range d.BudgetTransactions {
			if d.BudgetTransactions[j].BudgetPayeeID != nil && *d.BudgetTransactions[j].BudgetPayeeID == oldID {
				d.BudgetTransactions[j].BudgetPayeeID = &newID
			}
		}

		for j := range d.ShopCategories {
			if d.ShopCategories[j].BudgetPayeeID != nil && *d.ShopCategories[j].BudgetPayeeID == oldID {
				d.ShopCategories[j].BudgetPayeeID = &newID
			}
		}

		for j := range d.ShopItems {
			if d.ShopItems[j].BudgetPayeeID != nil && *d.ShopItems[j].BudgetPayeeID == oldID {
				d.ShopItems[j].BudgetPayeeID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetRecurrences(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.BudgetRecurrences {
		if err := d.BudgetRecurrences[i].Recurrence.Validate(); err != nil {
			return logger.Error(ctx, err)
		}

		if err := d.BudgetRecurrences[i].Template.Validate(); err != nil {
			return logger.Error(ctx, err)
		}

		if err := Create(ctx, &d.BudgetRecurrences[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createBudgetTransactions(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.BudgetTransactions {
		if err := d.BudgetTransactions[i].Validate(); err != nil {
			return logger.Error(ctx, err)
		}

		if err := Create(ctx, &d.BudgetTransactions[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createCalendarEvents(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.CalendarEvents {
		if d.CalendarEvents[i].Recurrence != nil {
			if err := d.CalendarEvents[i].Recurrence.Validate(); err != nil {
				return logger.Error(ctx, err)
			}
		}

		if err := Create(ctx, &d.CalendarEvents[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createCalendarICalendars(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.CalendarICalendars {
		oldID := d.CalendarICalendars[i].ID

		if err := Create(ctx, &d.CalendarICalendars[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.CalendarICalendars[i].ID

		for j := range d.CalendarEvents {
			if d.CalendarEvents[j].CalendarICalendarID == oldID {
				d.CalendarEvents[j].CalendarICalendarID = newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createCookMealPlans(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.CookMealPlans {
		oldID := d.CookMealPlans[i].ID

		if err := Create(ctx, &d.CookMealPlans[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.CookMealPlans[i].ID

		for j := range d.ShopItems {
			if d.ShopItems[j].CookMealPlanID != nil && *d.ShopItems[j].CookMealPlanID == oldID {
				d.ShopItems[j].CookMealPlanID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createCookMealTimes(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.CookMealTimes {
		oldID := d.CookMealTimes[i].ID

		if err := Create(ctx, &d.CookMealTimes[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.CookMealTimes[i].ID

		for j := range d.CookMealPlans {
			if d.CookMealPlans[j].CookMealTimeID == oldID {
				d.CookMealPlans[j].CookMealTimeID = newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createCookRecipes(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.CookRecipes {
		oldID := d.CookRecipes[i].ID

		if err := Create(ctx, &d.CookRecipes[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.CookRecipes[i].ID

		for j := range d.CookMealPlans {
			if d.CookMealPlans[j].CookRecipeID != nil && *d.CookMealPlans[j].CookRecipeID == oldID {
				d.CookMealPlans[j].CookRecipeID = &newID
			}
		}

		for j := range d.ShopItems {
			if d.ShopItems[j].CookRecipeID != nil && *d.ShopItems[j].CookRecipeID == oldID {
				d.ShopItems[j].CookRecipeID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createHealthItems(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.HealthItems {
		oldID := d.HealthItems[i].ID

		if err := Create(ctx, &d.HealthItems[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.HealthItems[i].ID

		for j := range d.HealthLogs {
			if d.HealthLogs[j].HealthItemID == oldID {
				d.HealthLogs[j].HealthItemID = newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createHealthLogs(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.HealthLogs {
		if err := Create(ctx, &d.HealthLogs[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createInventoryCollections(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.InventoryCollections {
		if err := Create(ctx, &d.InventoryCollections[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createInventoryItems(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.InventoryItems {
		oldID := d.InventoryItems[i].ID

		if err := Create(ctx, &d.InventoryItems[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.InventoryItems[i].ID

		for j := range d.PlanTasks {
			if d.PlanTasks[j].InventoryItemID != nil && *d.PlanTasks[j].InventoryItemID == oldID {
				d.PlanTasks[j].InventoryItemID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createNotesPages(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.NotesPages {
		oldID := d.NotesPages[i].ID

		if err := Create(ctx, &d.NotesPages[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.NotesPages[i].ID

		for j := range d.NotesPages {
			if d.NotesPages[j].ParentID != nil && *d.NotesPages[j].ParentID == oldID {
				d.NotesPages[j].ParentID = &newID
			}
		}

		for j := range d.NotesPageVersions {
			if d.NotesPageVersions[j].NotesPageID == oldID {
				d.NotesPageVersions[j].NotesPageID = newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createNotesPageVersions(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.NotesPageVersions {
		if err := Create(ctx, &d.NotesPageVersions[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createPlanProjects(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.PlanProjects {
		oldID := d.PlanProjects[i].ID

		if err := Create(ctx, &d.PlanProjects[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.PlanProjects[i].ID

		for j := range d.PlanProjects {
			if d.PlanProjects[j].ParentID != nil && *d.PlanProjects[j].ParentID == oldID {
				d.PlanProjects[j].ParentID = &newID
			}
		}

		for j := range d.PlanTasks {
			if d.PlanTasks[j].PlanProjectID != nil && *d.PlanTasks[j].PlanProjectID == oldID {
				d.PlanTasks[j].PlanProjectID = &newID
			}
		}

		for j := range d.ShopItems {
			if d.ShopItems[j].PlanProjectID != nil && *d.ShopItems[j].PlanProjectID == oldID {
				d.ShopItems[j].PlanProjectID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createPlanTasks(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.PlanTasks {
		if d.PlanTasks[i].Recurrence != nil {
			if err := d.PlanTasks[i].Recurrence.Validate(); err != nil {
				return logger.Error(ctx, err)
			}
		}

		oldID := d.PlanTasks[i].ID

		if err := Create(ctx, &d.PlanTasks[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.PlanTasks[i].ID

		for j := range d.PlanTasks {
			if d.PlanTasks[j].ParentID != nil && *d.PlanTasks[j].ParentID == oldID {
				d.PlanTasks[j].ParentID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createRewardCards(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.RewardCards {
		if err := Create(ctx, &d.RewardCards[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createSecretsValues(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.SecretsValues {
		if err := Create(ctx, &d.SecretsValues[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createSecretsVaults(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.SecretsVaults {
		oldID := d.SecretsVaults[i].ID

		if err := Create(ctx, &d.SecretsVaults[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.SecretsVaults[i].ID

		for j := range d.SecretsValues {
			if d.SecretsValues[j].SecretsVaultID == oldID {
				d.SecretsValues[j].SecretsVaultID = newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createShopCategories(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.ShopCategories {
		oldID := d.ShopCategories[i].ID

		if err := Create(ctx, &d.ShopCategories[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.ShopCategories[i].ID

		for j := range d.ShopItems {
			if d.ShopItems[j].ShopCategoryID != nil && *d.ShopItems[j].ShopCategoryID == oldID {
				d.ShopItems[j].ShopCategoryID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createShopItems(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.ShopItems {
		if err := Create(ctx, &d.ShopItems[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) createShopLists(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	for i := range d.ShopLists {
		oldID := d.ShopLists[i].ID

		if err := Create(ctx, &d.ShopLists[i], CreateOpts{
			Restore: true,
		}); err != nil {
			return logger.Error(ctx, err)
		}

		newID := d.ShopLists[i].ID

		for j := range d.ShopItems {
			if d.ShopItems[j].ShopListID != nil && *d.ShopItems[j].ShopListID == oldID {
				d.ShopItems[j].ShopListID = &newID
			}
		}
	}

	return logger.Error(ctx, nil)
}

func (d *Data) readAuthSessions(ctx context.Context, authAccountID *uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	authSessions := AuthSessions{}

	err := logger.Error(ctx, db.Query(ctx, true, &authSessions, `
SELECT *
FROM auth_session
WHERE
	auth_account_id = $1
`, nil, authAccountID))

	d.AuthSessions = append(d.AuthSessions, authSessions...)

	return err
}

func (d *Data) readCalendarEvents(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	calendarEvents := CalendarEvents{}

	if _, _, err := ReadAll(ctx, &calendarEvents, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.CalendarEvents = append(d.CalendarEvents, calendarEvents...)

	return logger.Error(ctx, nil)
}

func (d *Data) readCalendarICalendars(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	calendarICalendars := CalendarICalendars{}

	if _, _, err := ReadAll(ctx, &calendarICalendars, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.CalendarICalendars = append(d.CalendarICalendars, calendarICalendars...)

	return logger.Error(ctx, nil)
}

func (d *Data) readBookmarks(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	bookmarks := Bookmarks{}

	if _, _, err := ReadAll(ctx, &bookmarks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.Bookmarks = append(d.Bookmarks, bookmarks...)

	return logger.Error(ctx, nil)
}

func (d *Data) readHealthItems(ctx context.Context, authAccountID *uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	items := HealthItems{}

	if _, _, err := ReadAll(ctx, &items, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: authAccountID,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.HealthItems = append(d.HealthItems, items...)

	return logger.Error(ctx, nil)
}

func (d *Data) readHealthLogs(ctx context.Context, authAccountID *uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	logs := HealthLogs{}

	if _, _, err := ReadAll(ctx, &logs, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: authAccountID,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.HealthLogs = append(d.HealthLogs, logs...)

	return logger.Error(ctx, nil)
}

func (d *Data) readNotesPages(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	notesPages := NotesPages{}

	if _, _, err := ReadAll(ctx, &notesPages, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.NotesPages = append(d.NotesPages, notesPages...)

	return logger.Error(ctx, nil)
}

func (d *Data) readNotesPageVersions(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	notesPageVersions := NotesPageVersions{}

	if _, _, err := ReadAll(ctx, &notesPageVersions, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.NotesPageVersions = append(d.NotesPageVersions, notesPageVersions...)

	return logger.Error(ctx, nil)
}

func (d *Data) readPlanProjects(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	planProjects := PlanProjects{}

	if _, _, err := ReadAll(ctx, &planProjects, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.PlanProjects = append(d.PlanProjects, planProjects...)

	return logger.Error(ctx, nil)
}

func (d *Data) readPlanTasks(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	planTasks := PlanTasks{}

	if _, _, err := ReadAll(ctx, &planTasks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.PlanTasks = append(d.PlanTasks, planTasks...)

	return logger.Error(ctx, nil)
}

func (d *Data) readSecretsValues(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	secretsValues := SecretsValues{}

	if _, _, err := ReadAll(ctx, &secretsValues, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.SecretsValues = append(d.SecretsValues, secretsValues...)

	return logger.Error(ctx, nil)
}

func (d *Data) readSecretsVaults(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	secretsVaults := SecretsVaults{}

	if _, _, err := ReadAll(ctx, &secretsVaults, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.SecretsVaults = append(d.SecretsVaults, secretsVaults...)

	return logger.Error(ctx, nil)
}

func (d *Data) readShopLists(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	shopLists := ShopLists{}

	if _, _, err := ReadAll(ctx, &shopLists, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.ShopLists = append(d.ShopLists, shopLists...)

	return logger.Error(ctx, nil)
}

func (d *Data) readShopItems(ctx context.Context, authAccountID *uuid.UUID, ahp *AuthHouseholdsPermissions) errs.Err {
	ctx = logger.Trace(ctx)

	shopItems := ShopItems{}

	if _, _, err := ReadAll(ctx, &shopItems, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:             authAccountID,
			AuthHouseholdsPermissions: ahp,
		},
	}); err != nil {
		return logger.Error(ctx, err)
	}

	d.ShopItems = append(d.ShopItems, shopItems...)

	return logger.Error(ctx, nil)
}
