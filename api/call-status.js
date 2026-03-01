export default async function handler(req, res) {
    const { call_id } = req.query;

    if (!call_id) {
        return res.status(400).json({ error: 'call_id is required' });
    }

    try {
        const response = await fetch('https://api.bland.ai/api/v1/calls/' + call_id, {
            headers: {
                'Authorization': process.env.BLAND_API_KEY
            }
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}