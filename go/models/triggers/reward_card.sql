CREATE OR REPLACE TRIGGER adiu_reward_card_notify
	AFTER DELETE OR INSERT OR UPDATE ON reward_card
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_reward_card_noop
	BEFORE UPDATE ON reward_card
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_reward_card_updated
	BEFORE UPDATE ON reward_card
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
