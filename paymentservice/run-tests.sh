#!/bin/bash

# Payment Service Test Runner
# Unified script to run all available tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL=${1:-"http://localhost:8080"}
TEST_TYPE=${2:-"all"}

print_banner() {
    echo -e "${CYAN}
╔══════════════════════════════════════════════════════════════════╗
║                    Payment Service Test Runner                   ║
║                                                                  ║
║  Unified testing suite for Java Spring Boot Payment MCP Server   ║
║  Base URL: $BASE_URL                            ║
╚══════════════════════════════════════════════════════════════════╝
${NC}"
}

print_section() {
    echo -e "\n${BLUE}===== $1 =====${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_service() {
    print_section "SERVICE HEALTH CHECK"
    
    if curl -s -f "$BASE_URL/api/v1/transactions?page=0&size=1" > /dev/null 2>&1; then
        print_success "Payment service is running and accessible"
        return 0
    else
        print_error "Payment service is not accessible at $BASE_URL"
        echo -e "${YELLOW}To start the service, run: java -jar target/payments-service-1.0.0.jar${NC}"
        return 1
    fi
}

run_quick_test() {
    print_section "QUICK API TESTS"
    
    if [ -f "./quick-test.sh" ]; then
        print_info "Running quick API health checks..."
        if ./quick-test.sh "$BASE_URL"; then
            print_success "Quick tests completed successfully"
            return 0
        else
            print_error "Quick tests failed"
            return 1
        fi
    else
        print_error "quick-test.sh not found"
        return 1
    fi
}

run_comprehensive_test() {
    print_section "COMPREHENSIVE API TESTS"
    
    if [ -f "./test-api-endpoints.sh" ]; then
        print_info "Running comprehensive API endpoint tests..."
        if ./test-api-endpoints.sh "$BASE_URL"; then
            print_success "Comprehensive tests completed successfully"
            return 0
        else
            print_error "Comprehensive tests failed"
            return 1
        fi
    else
        print_error "test-api-endpoints.sh not found"
        return 1
    fi
}

run_junit_tests() {
    print_section "JUNIT INTEGRATION TESTS"
    
    if [ -f "./pom.xml" ]; then
        print_info "Running JUnit integration tests..."
        if mvn test -Dtest=PaymentServiceApiIntegrationTest -q; then
            print_success "JUnit tests completed successfully"
            return 0
        else
            print_error "JUnit tests failed"
            return 1
        fi
    else
        print_error "Maven pom.xml not found"
        return 1
    fi
}

run_all_tests() {
    print_section "RUNNING ALL TEST SUITES"
    
    local quick_result=0
    local comprehensive_result=0
    local junit_result=0
    
    # Run quick tests
    if ! run_quick_test; then
        quick_result=1
    fi
    
    # Run comprehensive tests
    if ! run_comprehensive_test; then
        comprehensive_result=1
    fi
    
    # Run JUnit tests
    if ! run_junit_tests; then
        junit_result=1
    fi
    
    # Summary
    print_section "TEST EXECUTION SUMMARY"
    
    if [ $quick_result -eq 0 ]; then
        print_success "Quick Tests: PASSED"
    else
        print_error "Quick Tests: FAILED"
    fi
    
    if [ $comprehensive_result -eq 0 ]; then
        print_success "Comprehensive Tests: PASSED"
    else
        print_error "Comprehensive Tests: FAILED"
    fi
    
    if [ $junit_result -eq 0 ]; then
        print_success "JUnit Tests: PASSED"
    else
        print_error "JUnit Tests: FAILED"
    fi
    
    local total_failures=$((quick_result + comprehensive_result + junit_result))
    
    if [ $total_failures -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TEST SUITES PASSED! Payment Service is fully functional.${NC}"
        return 0
    else
        echo -e "\n${RED}⚠️  $total_failures test suite(s) failed. Please review the output above.${NC}"
        return 1
    fi
}

show_help() {
    echo "Payment Service Test Runner"
    echo ""
    echo "Usage: $0 [base_url] [test_type]"
    echo ""
    echo "Arguments:"
    echo "  base_url     Base URL of the payment service (default: http://localhost:8080)"
    echo "  test_type    Type of tests to run: quick|comprehensive|junit|all (default: all)"
    echo ""
    echo "Test Types:"
    echo "  quick        - Fast health checks and basic API tests (~30 seconds)"
    echo "  comprehensive - Complete API endpoint testing (~2-3 minutes)"
    echo "  junit        - Java-based integration tests (~1-2 minutes)"
    echo "  all          - Run all test suites (~3-5 minutes)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests on localhost:8080"
    echo "  $0 http://localhost:8080              # Run all tests on specific local port"
    echo "  $0 http://localhost:8080 quick        # Run only quick tests"
    echo "  $0 https://api.example.com comprehensive # Run comprehensive tests on remote server"
    echo ""
    echo "Available Test Files:"
    echo "  - quick-test.sh                       # Quick health checks"
    echo "  - test-api-endpoints.sh               # Comprehensive API testing"
    echo "  - PaymentServiceApiIntegrationTest.java # JUnit integration tests"
    echo ""
    echo "For more information, see TEST_README.md"
}

# Main execution
main() {
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi
    
    print_banner
    
    # Check if service is running
    if ! check_service; then
        exit 1
    fi
    
    # Run tests based on type
    case "$TEST_TYPE" in
        "quick")
            run_quick_test
            ;;
        "comprehensive")
            run_comprehensive_test
            ;;
        "junit")
            run_junit_tests
            ;;
        "all")
            run_all_tests
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            echo "Valid types: quick, comprehensive, junit, all"
            exit 1
            ;;
    esac
}

# Check dependencies
check_dependencies() {
    local missing_deps=0
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        missing_deps=1
    fi
    
    if [ "$TEST_TYPE" = "junit" ] || [ "$TEST_TYPE" = "all" ]; then
        if ! command -v mvn &> /dev/null; then
            print_error "Maven is required for JUnit tests but not installed"
            missing_deps=1
        fi
    fi
    
    if [ $missing_deps -eq 1 ]; then
        echo -e "${YELLOW}Please install missing dependencies and try again.${NC}"
        exit 1
    fi
}

# Entry point
check_dependencies
main "$@"
