
CREATE OR REPLACE FUNCTION public.check_user_credits(p_user_id uuid, required_credits integer)
RETURNS TABLE(has_credits boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_credits integer;
    v_free_tier_used integer;
    v_has_subscription boolean;
    FREE_TIER_LIMIT CONSTANT integer := 3;  -- Changed from 12 to 3
    v_anonymous_session_used boolean;
BEGIN
    -- Handle anonymous users (when p_user_id is null)
    IF p_user_id IS NULL THEN
        -- Check if this anonymous session has been used
        SELECT used INTO v_anonymous_session_used
        FROM anonymous_usage
        WHERE session_id = current_setting('request.headers')::json->>'x-session-id';

        IF v_anonymous_session_used IS NULL OR NOT v_anonymous_session_used THEN
            RETURN QUERY SELECT 
                true::boolean,
                'Anonymous trial generation'::text;
        ELSE
            RETURN QUERY SELECT 
                false::boolean,
                'Anonymous trial has been used. Please register to continue.'::text;
        END IF;
        RETURN;
    END IF;

    -- Keep existing logic for authenticated users
    SELECT EXISTS (
        SELECT 1 FROM subscriptions 
        WHERE user_id = p_user_id 
        AND active = true 
        AND credits_remaining >= required_credits
    ) INTO v_has_subscription;

    IF v_has_subscription THEN
        RETURN QUERY SELECT true::boolean, null::text;
        RETURN;
    END IF;

    SELECT COALESCE(generations_used, 0)
    INTO v_free_tier_used
    FROM free_tier_usage
    WHERE user_id = p_user_id;

    IF v_free_tier_used IS NULL THEN
        INSERT INTO free_tier_usage (user_id, generations_used)
        VALUES (p_user_id, 0)
        RETURNING generations_used INTO v_free_tier_used;
    END IF;

    IF v_free_tier_used < FREE_TIER_LIMIT THEN
        UPDATE free_tier_usage 
        SET generations_used = generations_used + 1
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            true::boolean,
            format('Free tier generation %s/%s', v_free_tier_used + 1, FREE_TIER_LIMIT)::text;
    ELSE
        RETURN QUERY SELECT 
            false::boolean,
            format('You have used all %s free generations. Please upgrade to continue.', FREE_TIER_LIMIT)::text;
    END IF;
END;
$$;
