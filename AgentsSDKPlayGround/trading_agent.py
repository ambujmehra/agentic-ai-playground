#!/usr/bin/env python3
"""
Generic Trading Agent with Kite MCP Server Integration

This agent provides real-time market analysis for any stock symbol
using the Kite Connect MCP server for live market data access.
"""

import asyncio
import os
import re
import json
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from agents import Agent, Runner
from agents.mcp import MCPServerSse
from pydantic import BaseModel

# Configuration
KITE_MCP_SSE_URL = "https://mcp.kite.trade/sse"  # Hosted Kite MCP Server (SSE endpoint)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")


class StockQuoteAnalysis(BaseModel):
    """Structured output for stock analysis"""
    symbol: str
    exchange: str
    current_price: float
    price_change: float
    price_change_percent: float
    volume: int
    signal: str  # BUY, SELL, HOLD
    confidence: float  # 0.0 to 1.0
    reasoning: str
    timestamp: str


class TradingAgent:
    """Generic trading agent for any stock symbol analysis"""
    
    def __init__(self):
        self.agent = None
        self.mcp_server = None
        self.price_history = {}  # Store history per symbol
        self.current_symbol = None
        self.current_exchange = None
        
    def parse_symbol_from_query(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract trading symbol and exchange from user query"""
        query_upper = query.upper()

        # Pattern 1: "NSE:RELIANCE" format
        match = re.search(r'(NSE|BSE|NFO|MCX):([A-Z0-9&\-]+)', query_upper)
        if match:
            return match.group(2), match.group(1)

        # Pattern 2: "RELIANCE on NSE" format
        match = re.search(r'([A-Z0-9&\-]+)\s+(?:ON|AT|TRADED\s+AT)\s+(NSE|BSE|NFO|MCX)', query_upper)
        if match:
            return match.group(1), match.group(2)

        # Pattern 3: "NSE RELIANCE" format
        match = re.search(r'(NSE|BSE|NFO|MCX)\s+([A-Z0-9&\-]+)', query_upper)
        if match:
            return match.group(2), match.group(1)

        # Pattern 4: Known symbols, default to NSE
        known_symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICI', 'SBI', 'ITC',
                        'HDFCBANK', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'ASIANPAINT',
                        'MARUTI', 'TITAN', 'NESTLEIND', 'ULTRACEMCO', 'BAJFINANCE',
                        'SENSEX', 'NIFTY']

        for symbol in known_symbols:
            if symbol in query_upper:
                return symbol, "NSE"

        return None, None
    
    def format_instrument_key(self, symbol: str, exchange: str) -> str:
        """Format symbol and exchange for Kite API"""
        return f"{exchange}:{symbol}"
    
    async def initialize(self):
        """Initialize the trading agent with MCP server and authentication"""
        print("🚀 Initializing Generic Trading Agent...")
        print("📡 Connecting to Kite MCP Server...")
        
        # Setup Kite MCP Server with SSE transport
        self.mcp_server = MCPServerSse(
            url=KITE_MCP_SSE_URL,
            name="kite-trading-server"
        )
        
        # Create trading agent with market analysis capabilities
        self.agent = Agent(
            name="generic_trading_agent",
            instructions="""
            You are an expert stock trading analyst with real-time market data access.
            
            Your responsibilities:
            1. Analyze any stock symbol provided by the user
            2. Monitor stock quotes and analyze price movements
            3. Provide trading signals (BUY/SELL/HOLD) with confidence levels
            4. Track price trends and volume patterns
            5. Generate structured analysis with clear reasoning
            
            Trading Rules:
            - BUY signal: Strong upward momentum, high volume, positive sentiment
            - SELL signal: Downward trend, profit-taking opportunity, risk management
            - HOLD signal: Sideways movement, unclear trend, wait for better entry
            
            Analysis Requirements:
            - Current price analysis
            - Price change and percentage
            - Volume analysis
            - Clear trading signal with confidence (0.0-1.0)
            - Detailed reasoning for the signal
            
            Use the available Kite MCP tools for market data access.
            Always specify the correct exchange:symbol format (e.g., NSE:RELIANCE).
            """,
            model="gpt-4",
            output_type=StockQuoteAnalysis,
            mcp_servers=[self.mcp_server]
        )
        
        print("✅ Agent created successfully!")
        
        # Force authentication and get user profile
        await self._authenticate_and_welcome()
        
    async def _authenticate_and_welcome(self):
        """Handle authentication and display welcome message with profile"""
        print("🔐 Authenticating with Kite...")
        
        # First, try to get profile (this will trigger auth if needed)
        profile_result = await self._get_user_profile()
        
        if not profile_result:
            print("❌ Authentication failed. Please check your setup.")
            return False
            
        print("✅ Authentication successful!")
        print("🎯 Generic Trading Agent is ready for market analysis!")
        return True
    
    async def _get_user_profile(self):
        """Get user profile and handle authentication flow"""
        max_attempts = 3
        
        for attempt in range(max_attempts):
            try:
                # Try to get profile
                result = await Runner.run(
                    self.agent,
                    input="Get my user profile information using the get_profile tool.",
                    context=None
                )
                
                if result and hasattr(result, 'final_output'):
                    output = str(result.final_output)
                    
                    # Check if we need to login
                    if any(keyword in output.lower() for keyword in ['login', 'authenticate', 'session']):
                        print(f"🔑 Login required (attempt {attempt + 1}/{max_attempts})")
                        
                        # Call login tool
                        login_result = await Runner.run(
                            self.agent,
                            input="Call the login tool to authenticate with Kite.",
                            context=None
                        )
                        
                        if login_result and hasattr(login_result, 'final_output'):
                            login_output = str(login_result.final_output)
                            if 'login' in login_output.lower() and 'kite' in login_output.lower():
                                print("🌐 Please complete authentication in your browser")
                                print("⏳ Waiting for authentication completion...")
                                
                                # Wait a moment for user to complete auth
                                await asyncio.sleep(5)
                                continue
                    else:
                        # Successfully got profile
                        self._display_welcome_message(output)
                        return True
                        
            except Exception as e:
                print(f"⚠️ Error during authentication attempt {attempt + 1}: {e}")
                
        print("❌ Authentication failed after all attempts")
        return False
    
    def _display_welcome_message(self, profile_data: str):
        """Display welcome message with profile information"""
        print("\n" + "="*60)
        print("🎉 WELCOME TO GENERIC TRADING AGENT")
        print("="*60)
        print("👤 Profile Information:")
        print(f"📊 {profile_data}")
        print("="*60)
        print("🎯 Ready to analyze any stock symbol!")
        print("📈 Real-time market data and trading signals available")
        print("📋 Supported exchanges: NSE, BSE, NFO, MCX")
        print("="*60)
    
    async def get_stock_quote(self, symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
        """Get current stock quote using MCP tools"""
        try:
            instrument_key = self.format_instrument_key(symbol, exchange)
            result = await Runner.run(
                self.agent,
                input=f"Get the current real-time quote for {symbol} stock on {exchange} exchange. Use the get_quotes tool with symbol {instrument_key}.",
                context=None
            )
            return result
        except Exception as e:
            print(f"❌ Error getting {symbol} quote: {e}")
            return None
    
    def filter_symbol_data(self, quote_data_string: str, symbol: str) -> bool:
        """Check if response contains data for the specified symbol"""
        try:
            data = json.loads(quote_data_string)
            if data.get("status") != "success":
                return False

            quote_data = data.get("data", {})
            return any(symbol.upper() in key.upper() for key in quote_data.keys())

        except (json.JSONDecodeError, AttributeError):
            return symbol.upper() in quote_data_string.upper()

    def extract_quote_data(self, quote_data_string: str, symbol: str) -> Dict[str, Any]:
        """Extract quote data from JSON response for the specified symbol"""
        try:
            data = json.loads(quote_data_string)
            quote_data = data.get("data", {})

            for instrument_key, quote_info in quote_data.items():
                if symbol.upper() in instrument_key.upper():
                    return {
                        "symbol": instrument_key,
                        "last_price": quote_info.get("last_price", 0),
                        "volume": quote_info.get("volume", 0),
                        "ohlc": quote_info.get("ohlc", {}),
                        "net_change": quote_info.get("net_change", 0),
                        "instrument_token": quote_info.get("instrument_token", 0)
                    }
            return None

        except (json.JSONDecodeError, AttributeError):
            return None

    async def analyze_stock_from_query(self, user_query: str) -> Dict[str, Any]:
        """Analyze stock based on user query"""
        symbol, exchange = self.parse_symbol_from_query(user_query)

        if not symbol:
            return {"error": "Could not extract stock symbol from query. Please specify a symbol like 'RELIANCE', 'NSE:TCS', or 'HDFC on BSE'."}

        exchange = exchange or "NSE"
        print(f"📊 Analyzing {symbol} on {exchange} exchange...")

        self.current_symbol = symbol
        self.current_exchange = exchange

        quote_result = await self.get_stock_quote(symbol, exchange)
        if not quote_result:
            return {"error": f"Failed to get quote data for {symbol} on {exchange}"}

        return {
            "symbol": symbol,
            "exchange": exchange,
            "quote_result": quote_result,
            "timestamp": datetime.now().isoformat()
        }

    async def stream_stock_quotes(self, symbol: str, exchange: str = "NSE", duration_minutes: int = 30):
        """Stream real-time quotes for specified stock"""
        print(f"📡 Starting {symbol} quote streaming on {exchange} for {duration_minutes} minutes...")

        end_time = datetime.now().timestamp() + (duration_minutes * 60)
        quote_count = 0

        while datetime.now().timestamp() < end_time:
            try:
                quote_result = await self.get_stock_quote(symbol, exchange)

                if quote_result and hasattr(quote_result, 'final_output'):
                    output = str(quote_result.final_output)

                    if self.filter_symbol_data(output, symbol):
                        quote_count += 1
                        current_time = datetime.now().strftime("%H:%M:%S")
                        print(f"📥 {symbol} Quote #{quote_count} received at {current_time}")

                        quote_data = self.extract_quote_data(output, symbol)
                        if quote_data:
                            # Store in price history
                            if symbol not in self.price_history:
                                self.price_history[symbol] = []
                            self.price_history[symbol].append({"timestamp": current_time, "data": quote_data})

                            # Display key metrics
                            print(f"💰 Price: ₹{quote_data.get('last_price', 'N/A')}")
                            print(f"📊 Volume: {quote_data.get('volume', 'N/A'):,}")

                            # Show analysis if available
                            if hasattr(quote_result, 'final_output') and isinstance(quote_result.final_output, dict):
                                analysis = quote_result.final_output
                                if 'signal' in analysis:
                                    signal_emoji = {"BUY": "🟢", "SELL": "🔴", "HOLD": "🟡"}.get(analysis['signal'], "⚪")
                                    print(f"{signal_emoji} Signal: {analysis['signal']} (Confidence: {analysis.get('confidence', 0):.2f})")

                        print("-" * 50)
                    else:
                        print(f"⚠️ No {symbol} data in response")
                else:
                    print(f"❌ Failed to get {symbol} quote")

                await asyncio.sleep(30)

            except Exception as e:
                print(f"❌ Error in streaming: {e}")
                await asyncio.sleep(30)

        print(f"✅ Streaming session completed. Total quotes received: {quote_count}")

    async def run_trading_session(self, user_query: str = None):
        """Run a complete trading session"""
        await self.initialize()

        if not user_query:
            print("\n❓ No query provided. Please specify a stock to analyze.")
            print("Example: 'Do live analysis of RELIANCE stock traded at NSE'")
            return

        print(f"\n🔍 Processing query: '{user_query}'")

        analysis_result = await self.analyze_stock_from_query(user_query)
        if "error" in analysis_result:
            print(f"❌ {analysis_result['error']}")
            return

        symbol = analysis_result["symbol"]
        exchange = analysis_result["exchange"]

        print(f"\n🔄 Starting {symbol} quote streaming on {exchange}...")
        await self.stream_stock_quotes(symbol, exchange, duration_minutes=30)


async def main():
    """Main function to run the generic trading agent"""
    print("🚀 Generic Trading Agent")
    print("📡 Connecting to Kite MCP Server for real-time market data")

    # Example usage - modify this query as needed
    user_query = "Do live analysis of RELIANCE stock traded at NSE"

    agent = TradingAgent()
    await agent.run_trading_session(user_query)


if __name__ == "__main__":
    asyncio.run(main())
